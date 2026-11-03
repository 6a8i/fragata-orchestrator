import { open } from 'node:fs/promises'
import { ParsableFile, parseOVAFile } from 'fragata-vmdk-to-vhd'

/**
 * Random access to a slice of a local file, the node counterpart of the `File` the browser gives to
 * `parseOVAFile`: the OVF descriptor and the grain tables of the VMDKs are read in place, the file is
 * never loaded in memory.
 */
export class FileHandleParsableFile extends ParsableFile {
  #fileHandle
  #start
  #end

  /**
   * @param {import('node:fs/promises').FileHandle} fileHandle
   * @param {number} start
   * @param {number} end exclusive
   */
  constructor(fileHandle, start, end) {
    super()
    this.#fileHandle = fileHandle
    this.#start = start
    this.#end = end
  }

  // negative positions are from the end of this slice, like `Blob#slice`
  slice(start, end) {
    const length = this.#end - this.#start
    const resolve = position => {
      const offset = position < 0 ? Math.max(length + position, 0) : Math.min(position, length)
      return this.#start + offset
    }
    return new FileHandleParsableFile(this.#fileHandle, resolve(start), end === undefined ? this.#end : resolve(end))
  }

  async read() {
    const length = Math.max(this.#end - this.#start, 0)
    const buffer = Buffer.alloc(length)
    let offset = 0
    while (offset < length) {
      const { bytesRead } = await this.#fileHandle.read(buffer, offset, length - offset, this.#start + offset)
      if (bytesRead === 0) {
        break
      }
      offset += bytesRead
    }
    // `parseOVAFile` works on ArrayBuffers, which must not share the memory of other buffers
    return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + offset)
  }
}

const decodeString = (arrayBuffer, encoding) => Buffer.from(arrayBuffer).toString(encoding)

/**
 * Parses the OVA at `path`: the descriptor and the grain tables of each VMDK, as the legacy import
 * expects them (tables as `Uint32Array`s, disks as an array).
 */
export async function parseOvaFile(path) {
  const fileHandle = await open(path, 'r')
  try {
    const { size } = await fileHandle.stat()
    const data = await parseOVAFile(new FileHandleParsableFile(fileHandle, 0, size), decodeString)
    const tables = {}
    for (const [fileName, pTable] of Object.entries(data.tables)) {
      const { grainLogicalAddressList, grainFileOffsetList } = await pTable
      tables[fileName] = {
        grainLogicalAddressList: new Uint32Array(grainLogicalAddressList),
        grainFileOffsetList: new Uint32Array(grainFileOffsetList),
      }
    }
    return { ...data, tables }
  } finally {
    await fileHandle.close()
  }
}

const isPositiveInteger = value => Number.isSafeInteger(value) && value > 0

/**
 * Builds the `data` of the legacy OVA import from the parsed OVA and the choices of the user.
 *
 * @param {object} parsed result of `parseOvaFile`
 * @param {object} opts
 * @param {string} [opts.fileName] name of the uploaded file, the name of the VM when the OVF has none
 * @param {string} [opts.nameLabel]
 * @param {string} [opts.descriptionLabel]
 * @param {number} [opts.nCpus]
 * @param {number} [opts.memory] bytes
 * @param {string[]} [opts.networks] one network per VIF, replaces the VIFs of the OVF
 * @param {string} [opts.network] the network of every VIF of the OVF, required when `networks` is not
 * given and the OVF has VIFs
 */
export function buildOvaImportData(
  parsed,
  { fileName, nameLabel, descriptionLabel, nCpus, memory, networks, network } = {}
) {
  if (parsed.disks === undefined) {
    throw new Error('no OVF descriptor in this OVA')
  }

  const disks = Object.values(parsed.disks)
  for (const disk of disks) {
    if (disk.path === undefined) {
      throw new Error(`the disk ${disk.nameLabel ?? ''} references no file of the OVA`)
    }
    // compressed VMDKs are named after the file, e.g. `disk.vmdk.gz`
    if (parsed.tables[disk.path] === undefined) {
      throw new Error(`the disk ${disk.path} is missing from the OVA or is not a VMDK`)
    }
  }

  const data = {
    descriptionLabel: descriptionLabel ?? parsed.descriptionLabel ?? '',
    disks,
    memory: memory ?? parsed.memory,
    nameLabel: nameLabel || parsed.nameLabel || fileName?.replace(/\.ova$/i, '') || 'OVA import',
    nCpus: nCpus ?? parsed.nCpus,
    // the OVF only names its networks, they are mapped to networks of the pool
    networks: networks ?? (parsed.networks ?? []).map(() => network),
    tables: parsed.tables,
  }

  if (data.networks.some(id => id === undefined)) {
    throw new Error('a network of the pool is needed for the network interfaces of the OVF')
  }

  if (!isPositiveInteger(data.nCpus)) {
    throw new Error('the number of CPUs is missing from the OVF, it must be given')
  }
  if (!isPositiveInteger(data.memory)) {
    throw new Error('the memory is missing from the OVF, it must be given')
  }

  return data
}
