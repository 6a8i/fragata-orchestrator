import { createLogger } from '@fragata/log'
import { createReadStream, createWriteStream } from 'node:fs'
import { mkdtemp, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { pipeline } from 'node:stream/promises'
import { tmpdir } from 'node:os'
import { Task } from '@fragata/mixins/Tasks.mjs'

import { buildOvaImportData, parseOvaFile } from '../_ova-import.mjs'

const { warn } = createLogger('xo:mixins:ova-import')

/**
 * Import of OVA files received as a raw stream: the server parses the file itself instead of the
 * browser. The OVA is written to a temporary file because the grain tables of stream-optimized VMDKs
 * are at their end, then sent to the existing OVA import of the XAPI wrapper, which converts the VMDKs.
 */
export default class OvaImport {
  constructor(app) {
    this._app = app
  }

  /**
   * Writes the stream to a new temporary directory, `ovaImport.tmpDir` of the config or the temporary
   * directory of the system.
   *
   * @returns {Promise<{ path: string, dispose: () => Promise<void> }>}
   */
  async storeOvaInTmp(stream, { fileName = 'import.ova' } = {}) {
    const root = this._app.config.getOptional('ovaImport.tmpDir') ?? tmpdir()
    const dir = await mkdtemp(join(root, 'fragata-ova-'))
    const dispose = () => rm(dir, { force: true, recursive: true }).catch(error => warn('cleaning', { dir, error }))
    // the name is only informative, it must not escape the directory
    const path = join(dir, fileName.replace(/[^\w.-]/g, '_').replace(/^\.+/, '') || 'import.ova')
    try {
      await pipeline(stream, createWriteStream(path))
    } catch (error) {
      await dispose()
      throw error
    }
    return { path, dispose }
  }

  /**
   * @param {string} path a local OVA file, left in place
   * @param {object} opts
   * @param {string} opts.sr id of the SR of the disks
   * @param {string} [opts.network] network of all the VIFs, the management network of the pool by default
   * @param {string[]} [opts.networks] one network per VIF, replaces the VIFs of the OVF
   * @param {string} [opts.nameLabel]
   * @param {string} [opts.descriptionLabel]
   * @param {number} [opts.nCpus]
   * @param {number} [opts.memory] bytes
   * @param {string} [opts.fileName]
   * @returns {Promise<string>} the UUID of the new VM
   */
  async importOvaFile(path, { sr: srId, network, networks, ...overrides }) {
    const app = this._app
    const sr = app.getObject(srId, 'SR')
    const xapi = app.getXapi(sr)

    const parsed = await Task.run({ properties: { name: 'reading the OVA' } }, () => parseOvaFile(path))
    const data = buildOvaImportData(parsed, {
      ...overrides,
      networks,
      network: networks === undefined && network === undefined ? this.#managementNetwork(sr.$pool) : network,
    })

    for (const id of data.networks) {
      if (app.getObject(id, 'network').$pool !== sr.$pool) {
        throw new Error(`the network ${id} is not in the pool of the SR`)
      }
    }

    const ovaStream = createReadStream(path)
    try {
      const vm = await Task.run({ properties: { name: `importing the VM ${data.nameLabel}` } }, () =>
        xapi.importVm(ovaStream, { data, srId: sr._xapiId, type: 'ova' })
      )
      return vm.uuid
    } finally {
      // on failure, the import may stop reading in the middle of the file
      ovaStream.destroy()
    }
  }

  /** stores the stream in a temporary file, imports it, then removes the file */
  async importOva(stream, { fileName, ...opts }) {
    const { path, dispose } = await this.storeOvaInTmp(stream, { fileName })
    try {
      return await this.importOvaFile(path, { fileName, ...opts })
    } finally {
      await dispose()
    }
  }

  // the network of the management PIF of the master, like the legacy CLI import
  #managementNetwork(poolId) {
    const app = this._app
    const pool = app.getObject(poolId, 'pool')
    const [pif] = Object.values(
      app.getObjects({ filter: { type: 'PIF', management: true, $host: pool.master }, limit: 1 })
    )
    return pif?.$network
  }
}
