import assert from 'node:assert/strict'
import createReadableSparseStream from 'vhd-lib/createReadableSparseStream.js'
import test from 'node:test'
import { createWriteStream } from 'node:fs'
import { join } from 'node:path'
import { mkdtemp, open, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { writeOvaOn } from 'fragata-vmdk-to-vhd'
import { finished } from 'node:stream/promises'

import { buildOvaImportData, FileHandleParsableFile, parseOvaFile } from './_ova-import.mjs'

const { after, before, describe, it } = test

const MiB = 1024 * 1024

let dir
before(async () => {
  dir = await mkdtemp(join(tmpdir(), 'fragata-ova-test-'))
})
after(async () => {
  await rm(dir, { force: true, recursive: true })
})

// an OVA with one 4 MiB disk whose first 2 MiB are not empty, generated like the OVA export does
async function generateOva(path) {
  const BLOCK_SIZE = 2 * MiB
  const getStream = () =>
    createReadableSparseStream(4 * MiB, BLOCK_SIZE, [0], [{ logicalAddressBytes: 0, data: Buffer.alloc(BLOCK_SIZE, 42) }])
  const output = createWriteStream(path)
  await writeOvaOn(output, {
    vmName: 'synthetic',
    vmDescription: 'a test VM',
    vmMemoryMB: 128,
    cpuCount: 2,
    nics: [{ name: 'eth0', networkName: 'LAN' }],
    disks: [{ name: 'disk1', fileName: 'disk1.vmdk', capacityMB: 4, getStream }],
  })
  await finished(output)
}

describe('FileHandleParsableFile', () => {
  it('reads slices, negative positions are from the end', async () => {
    const path = join(dir, 'bytes')
    await writeFile(path, Buffer.from('0123456789'))
    const fileHandle = await open(path)
    try {
      const file = new FileHandleParsableFile(fileHandle, 0, 10)
      const text = async slice => Buffer.from(await slice.read()).toString()
      assert.equal(await text(file.slice(2, 5)), '234')
      assert.equal(await text(file.slice(2, 8).slice(1, 3)), '34')
      assert.equal(await text(file.slice(-4, -1)), '678')
      assert.equal(await text(file.slice(2, 8).slice(-2, 6)), '67')
      // past the end of the file
      assert.equal(await text(file.slice(8, 20)), '89')
      assert.equal(await text(file.slice(10, 20)), '')
    } finally {
      await fileHandle.close()
    }
  })
})

describe('parseOvaFile()', () => {
  it('reads the descriptor and the grain tables', async () => {
    const path = join(dir, 'synthetic.ova')
    await generateOva(path)

    const parsed = await parseOvaFile(path)
    assert.equal(parsed.nameLabel, 'synthetic')
    assert.equal(parsed.descriptionLabel, 'a test VM')
    assert.equal(parsed.nCpus, 2)
    assert.equal(parsed.memory, 128 * MiB)
    assert.deepEqual(parsed.networks, ['LAN'])
    assert.deepEqual(Object.keys(parsed.disks), ['vmdisk1'])
    assert.equal(parsed.disks.vmdisk1.path, 'disk1.vmdk')
    assert.equal(parsed.disks.vmdisk1.capacity, 4 * MiB)
    assert.equal(parsed.disks.vmdisk1.position, 0)

    const table = parsed.tables['disk1.vmdk']
    assert.ok(table.grainLogicalAddressList instanceof Uint32Array)
    assert.ok(table.grainFileOffsetList instanceof Uint32Array)
    assert.ok(table.grainLogicalAddressList.length > 0)
    assert.equal(table.grainLogicalAddressList.length, table.grainFileOffsetList.length)
    assert.equal(table.grainLogicalAddressList[0], 0)
  })

  it('fails on a file which is not an OVA', async () => {
    const path = join(dir, 'empty.ova')
    await writeFile(path, Buffer.alloc(1024))
    const parsed = await parseOvaFile(path)
    assert.throws(() => buildOvaImportData(parsed, { network: 'net' }), /no OVF descriptor/)
  })
})

describe('buildOvaImportData()', () => {
  const parsed = () => ({
    descriptionLabel: 'description',
    disks: { vmdisk1: { capacity: 4 * MiB, path: 'disk1.vmdk', nameLabel: 'Hard Disk 1', position: 0 } },
    memory: 128 * MiB,
    nameLabel: 'vm',
    nCpus: 2,
    networks: ['LAN', 'DMZ'],
    tables: { 'disk1.vmdk': { grainLogicalAddressList: new Uint32Array(), grainFileOffsetList: new Uint32Array() } },
  })

  it('maps every VIF of the OVF to the network', () => {
    const data = buildOvaImportData(parsed(), { network: 'net-1' })
    assert.deepEqual(data.networks, ['net-1', 'net-1'])
    assert.equal(data.nameLabel, 'vm')
    assert.equal(data.nCpus, 2)
    assert.equal(data.memory, 128 * MiB)
    assert.deepEqual(
      data.disks.map(({ path }) => path),
      ['disk1.vmdk']
    )
  })

  it('applies the overrides', () => {
    const data = buildOvaImportData(parsed(), {
      descriptionLabel: '',
      memory: 256 * MiB,
      nameLabel: 'renamed',
      nCpus: 4,
      networks: ['net-2'],
    })
    assert.deepEqual(data.networks, ['net-2'])
    assert.equal(data.nameLabel, 'renamed')
    assert.equal(data.descriptionLabel, '')
    assert.equal(data.nCpus, 4)
    assert.equal(data.memory, 256 * MiB)
  })

  it('names the VM after the file when the OVF does not', () => {
    const data = buildOvaImportData({ ...parsed(), nameLabel: undefined }, { fileName: 'Debian.OVA', network: 'n' })
    assert.equal(data.nameLabel, 'Debian')
  })

  it('needs a network for the VIFs of the OVF', () => {
    assert.throws(() => buildOvaImportData(parsed(), {}), /network/)
    assert.deepEqual(buildOvaImportData({ ...parsed(), networks: [] }, {}).networks, [])
  })

  it('needs the CPUs and the memory', () => {
    assert.throws(() => buildOvaImportData({ ...parsed(), nCpus: undefined }, { network: 'n' }), /CPUs/)
    assert.throws(() => buildOvaImportData({ ...parsed(), memory: NaN }, { network: 'n' }), /memory/)
  })

  it('rejects a disk missing from the OVA', () => {
    assert.throws(() => buildOvaImportData({ ...parsed(), tables: {} }, { network: 'n' }), /missing/)
  })
})
