// End-to-end tests of the REST API against a running orchestrator connected to a real pool.
//
// They create their own objects (a small VM, a cloud-init template, a tag…) and remove them at the end.
// See README.md for the environment they need.

import assert from 'node:assert/strict'
import { after, before, describe, it } from 'node:test'

import { ApiError, call, download, get, signIn, sleep, waitFor } from './lib.mjs'

const BACKUP_REPOSITORY = process.env.FRAGATA_BACKUP_REPOSITORY
const NAME = `e2e-${Date.now().toString(36)}`

let pool
let host
let sr
let network
let vmId

before(async () => {
  await signIn()
  const pools = await get('pools?fields=id,name_label,master')
  assert.ok(pools.length > 0, 'the orchestrator manages no pool')
  pool = pools[0]
  host = await get(`hosts/${pool.master}`)

  const srs = await get('srs?fields=id,name_label,SR_type,content_type,$pool,shared')
  const userSrs = srs.filter(s => s.$pool === pool.id && s.content_type === 'user')
  sr = userSrs.find(s => s.shared) ?? userSrs[0]
  network = (await get('networks?fields=id,name_label,$pool')).find(
    n => n.$pool === pool.id && /Pool-wide/.test(n.name_label)
  )

  const template = (await get('vm-templates?fields=uuid,name_label,$pool')).find(
    t => t.$pool === pool.id && t.name_label === 'Other install media'
  )
  const created = await call('POST', `pools/${pool.id}/actions/create_vm?sync=true`, {
    name_label: NAME,
    template: template.uuid,
    cpus: 1,
    memory: 256 * 1024 ** 2,
    hvmBootFirmware: 'uefi',
    vifs: [{ network: network.id }],
    vdis: [{ name_label: `${NAME}-disk`, size: 64 * 1024 ** 2, sr: sr.id }],
  })
  vmId = created.id
})

after(async () => {
  if (vmId !== undefined) {
    await call('DELETE', `vms/${vmId}`).catch(() => {})
  }
})

describe('pool and host administration', () => {
  it('updates and restores the description of the pool', async () => {
    const { name_description: previous } = await get(`pools/${pool.id}`)
    await call('PATCH', `pools/${pool.id}`, { nameDescription: NAME })
    assert.equal((await get(`pools/${pool.id}`)).name_description, NAME)
    await call('PATCH', `pools/${pool.id}`, { nameDescription: previous })
  })

  it('reads the health of the disks of the host', async () => {
    const smart = await get(`hosts/${host.id}/smartctl_health`)
    assert.ok(smart === null || typeof smart === 'object')
    const mdadm = await get(`hosts/${host.id}/mdadm_health`)
    assert.ok(mdadm === null || typeof mdadm === 'object')
  })

  it('lists the PCI devices of the host with their dom0 access', async () => {
    const pcis = await get(`hosts/${host.id}/pcis`)
    assert.ok(pcis.length > 0)
    assert.ok(pcis.every(pci => typeof pci.pciId === 'string'))
  })

  it('lists the missing patches of the pool', async () => {
    assert.ok(Array.isArray(await get(`pools/${pool.id}/missing_patches`)))
  })
})

describe('VM devices and custom fields', () => {
  it('adds and removes a vTPM, visible right after each change', async () => {
    const { id: vtpmId } = await call('POST', `vms/${vmId}/vtpms`)
    assert.deepEqual((await get(`vms/${vmId}/devices`)).vtpms, [vtpmId])
    await call('DELETE', `vms/${vmId}/vtpms/${vtpmId}`)
    assert.deepEqual((await get(`vms/${vmId}/devices`)).vtpms, [])
  })

  it('sets, replaces and removes a custom field, visible right after each change', async () => {
    await call('PUT', `vms/${vmId}/custom_fields/owner`, { value: 'a' })
    assert.deepEqual(await get(`vms/${vmId}/custom_fields`), { owner: 'a' })
    await call('PUT', `vms/${vmId}/custom_fields/owner`, { value: 'b' })
    assert.deepEqual(await get(`vms/${vmId}/custom_fields`), { owner: 'b' })
    await call('DELETE', `vms/${vmId}/custom_fields/owner`)
    assert.deepEqual(await get(`vms/${vmId}/custom_fields`), {})
  })

  it('takes, reverts and deletes a snapshot', async () => {
    const { id: snapshotId } = await call('POST', `vms/${vmId}/actions/snapshot?sync=true`, { name_label: NAME })
    await call('POST', `vms/${vmId}/actions/revert_snapshot?sync=true`, { snapshotId })
    await call('DELETE', `vm-snapshots/${snapshotId}`)
  })
})

describe('system settings', () => {
  it('creates, updates and deletes a cloud-init template', async () => {
    const { id } = await call('POST', 'cloud-configs', { name: NAME, template: '#cloud-config\n' })
    await call('PATCH', `cloud-configs/${id}`, { template: '#cloud-config\nhostname: {name}\n' })
    assert.equal((await get(`cloud-configs/${id}`)).template, '#cloud-config\nhostname: {name}\n')
    await call('DELETE', `cloud-configs/${id}`)
    await assert.rejects(get(`cloud-configs/${id}`), error => error instanceof ApiError && error.status === 404)
  })

  it('colors a tag and rejects an invalid color', async () => {
    await call('PATCH', `tags/${NAME}`, { color: '#c62828' })
    assert.equal((await get('tags')).find(tag => tag.id === NAME)?.color, '#c62828')
    await assert.rejects(call('PATCH', `tags/${NAME}`, { color: 'red' }), error => error.status === 422)
    await call('PATCH', `tags/${NAME}`, { color: null })
  })

  it('exports the configuration encrypted and refuses a wrong passphrase on import', async () => {
    const { data, headers } = await download('config/actions/export', { method: 'POST', body: { passphrase: NAME } })
    assert.match(headers.get('content-disposition'), /\.json\.gz\.enc"$/)
    assert.ok(data.length > 0)
    // importing with the right passphrase would replace the configuration of the orchestrator: not done here
    await assert.rejects(
      call('POST', 'config/actions/import', data, {
        'content-type': 'application/octet-stream',
        'x-config-passphrase': 'wrong',
      }),
      error => error.status === 422
    )
  })
})

describe('backups', { skip: BACKUP_REPOSITORY === undefined && 'FRAGATA_BACKUP_REPOSITORY is not set' }, () => {
  let jobId

  after(async () => {
    if (jobId !== undefined) {
      await call('DELETE', `backup-jobs/${jobId}`).catch(() => {})
    }
  })

  it('backs up the VM twice (full then delta) and restores it with the same disk content', async () => {
    const { id } = await call('POST', 'backup-jobs/vm', {
      name: NAME,
      mode: 'delta',
      remotes: { id: BACKUP_REPOSITORY },
      vms: { id: vmId },
      settings: { '': {}, tmp: { exportRetention: 2 } },
      schedules: { tmp: { cron: '0 3 * * *', enabled: false } },
    })
    jobId = id

    for (let i = 0; i < 2; i++) {
      const start = Date.now()
      await call('POST', `backup-jobs/${jobId}/actions/run`, {})
      const run = await waitFor(
        async () => {
          const logs = await get(`backup-logs?fields=id,status,start&filter=jobId:${jobId}`)
          const log = logs.find(l => l.start >= start - 1000)
          return log !== undefined && log.status !== 'pending' ? log : undefined
        },
        { timeout: 600e3, interval: 3e3 }
      )
      assert.equal(run.status, 'success')
    }

    const archives = (
      await get(`backup-archives?backup-repository=${BACKUP_REPOSITORY}&fields=id,timestamp,vm`)
    ).filter(archive => archive.vm?.uuid === vmId || archive.id.includes(vmId))
    assert.equal(archives.length, 2)
    const latest = archives.sort((a, b) => b.timestamp - a.timestamp)[0]

    const { id: restoredId } = await call(
      'POST',
      `backup-archives/${encodeURIComponent(latest.id)}/actions/restore?sync=true`,
      { srId: sr.id, vmNamePrefix: 'restored-' }
    )
    try {
      await sleep(2000)
      const diskOf = async id => {
        const vbds = await get(`vbds?fields=VDI,is_cd_drive&filter=VM:${id}`)
        return vbds.find(vbd => !vbd.is_cd_drive).VDI
      }
      const [original, restored] = await Promise.all([
        download(`vdis/${await diskOf(vmId)}.raw`).then(r => r.data),
        download(`vdis/${await diskOf(restoredId)}.raw`).then(r => r.data),
      ])
      assert.equal(restored.length, original.length)
      assert.ok(restored.equals(original), 'the restored disk differs from the original')
    } finally {
      await call('DELETE', `vms/${restoredId}`).catch(() => {})
    }

    for (const archive of archives) {
      await call('DELETE', `backup-archives/${encodeURIComponent(archive.id)}`).catch(() => {})
    }
  })
})
