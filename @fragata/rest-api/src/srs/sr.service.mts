import type { Xapi, XenApiSr, XoHost, XoNetwork, XoPool, XoSr } from '@fragata/types'
import { invalidParameters } from 'fragata-common/api-errors.js'
import type { RestApi } from '../rest-api/rest-api.mjs'

// Derived from `xapi.SR_create` params, renamed to stay consistent with the XO SR
// representation returned by `GET /srs/:id`: `hostId` (XO id, not XAPI ref),
// `SR_type` and `size` instead of XAPI's `type`/`physical_size`.
// `device_config` is passed through as-is, `shared` is computed from `SR_type`.
export type CreateSrBody = Omit<Parameters<Xapi['SR_create']>[0], 'host' | 'type' | 'physical_size' | 'shared'> & {
  hostId: string
  SR_type: XoSr['SR_type']
  size?: number
}

export type CreateXostorBody = {
  name_label: string
  name_description?: string
  /**
   * Disks to use, by host ID, as device paths (e.g. `/dev/sdb`). Hosts with an empty list are ignored, every host
   * must belong to the pool. The disks are formatted (LVM): they must have no partitions and must not be mounted.
   */
  // index signature, not `Record<string, string[]>`: tsoa emits an empty schema for `Record`
  disksByHost: { [hostId: string]: string[] }
  provisioning: 'thin' | 'thick'
  /**
   * Number of copies of each volume, between 1 and the number of hosts with disks
   *
   * @isInt
   * @minimum 1
   */
  replication: number
  /** destroy an existing `linstor_group` volume group and force the creation of the physical volumes */
  force?: boolean
  /** create the physical volumes even if the disks contain a file system */
  ignoreFileSystems?: boolean
  /** create a LINSTOR interface named `name` on this network (of the pool) and make it the preferred one */
  preferredInterface?: { networkId: string; name: string }
}

/** params of the `xostor.create` API method, built by `SrService#prepareXostorCreation` */
export type XostorCreateParams = Record<string, unknown> & { readonly __brand: 'XostorCreateParams' }

// device paths are given to the `lvm.py` plugin joined by commas
const DEVICE_PATH_RE = /^\/dev\/[^\s,]+$/

// SR types backed by network/SAN storage, every other type is local to the host
const SHARED_SR_TYPES: ReadonlySet<XoSr['SR_type']> = new Set([
  'cephfs',
  'glusterfs',
  'hba',
  'lvmofcoe',
  'lvmohba',
  'lvmoiscsi',
  'moosefs',
  'nfs',
  'smb',
])

export class SrService {
  #restApi: RestApi

  constructor(restApi: RestApi) {
    this.#restApi = restApi
  }

  async create(body: CreateSrBody): Promise<XoSr['id']> {
    const { hostId, SR_type, size, ...rest } = body
    if (SR_type === 'linstor') {
      // XOSTOR spans several hosts and formats their disks: it has its own route
      throw invalidParameters(
        'XOSTOR SRs (SR_type "linstor") are created with POST /rest/v0/pools/{id}/actions/create_xostor'
      )
    }
    const xapiHost = this.#restApi.getXapiObject<XoHost>(hostId as XoHost['id'], 'host')
    const ref = await xapiHost.$xapi.SR_create({
      ...rest,
      // XAPI expects ISO libraries to have an `iso` content type
      ...(SR_type === 'iso' && { content_type: 'iso' as const }),
      host: xapiHost.$ref,
      physical_size: size,
      // an ISO SR is local only when it targets a local path (`legacy_mode`), same rules as fragata-server `sr.createIso`
      shared: SR_type === 'iso' ? rest.device_config.legacy_mode !== 'true' : SHARED_SR_TYPES.has(SR_type),
      type: SR_type,
    })
    return (await xapiHost.$xapi.getField<XenApiSr, 'uuid'>('SR', ref, 'uuid')) as XoSr['id']
  }

  /**
   * Checks a XOSTOR creation request against the pool and returns the params of the `xostor.create` API method.
   *
   * Throws `invalidParameters` (422) or `noSuchObject` (404) synchronously, so that a route can answer before
   * starting a task.
   */
  prepareXostorCreation(poolId: XoPool['id'], body: CreateXostorBody): XostorCreateParams {
    const {
      disksByHost,
      force,
      ignoreFileSystems,
      name_description,
      name_label,
      preferredInterface,
      provisioning,
      replication,
    } = body

    // throws if the pool does not exist
    this.#restApi.getObject<XoPool>(poolId, 'pool')

    if (typeof name_label !== 'string' || name_label.trim() === '') {
      throw invalidParameters('name_label must not be empty')
    }
    if (provisioning !== 'thin' && provisioning !== 'thick') {
      throw invalidParameters('provisioning must be "thin" or "thick"')
    }

    const usedDisksByHost: Record<string, string[]> = {}
    for (const [hostId, disks] of Object.entries(disksByHost ?? {})) {
      if (!Array.isArray(disks)) {
        throw invalidParameters(`disks of host ${hostId} must be an array`)
      }
      if (disks.length === 0) {
        continue
      }
      const host = this.#restApi.getObject<XoHost>(hostId as XoHost['id'], 'host')
      if (host.$pool !== poolId) {
        throw invalidParameters(`host ${hostId} is not in pool ${poolId}`)
      }
      const invalidDisk = disks.find(disk => typeof disk !== 'string' || !DEVICE_PATH_RE.test(disk))
      if (invalidDisk !== undefined) {
        throw invalidParameters(`invalid device path ${JSON.stringify(invalidDisk)}, expected e.g. /dev/sdb`)
      }
      if (new Set(disks).size !== disks.length) {
        throw invalidParameters(`duplicate disks for host ${hostId}`)
      }
      usedDisksByHost[host.id] = disks
    }

    const nHosts = Object.keys(usedDisksByHost).length
    if (nHosts === 0) {
      throw invalidParameters('at least one host must have disks')
    }
    if (!Number.isInteger(replication) || replication < 1 || replication > nHosts) {
      throw invalidParameters(`replication must be an integer between 1 and ${nHosts} (number of hosts with disks)`)
    }

    let interfaceName: string | undefined
    if (preferredInterface !== undefined) {
      const network = this.#restApi.getObject<XoNetwork>(preferredInterface.networkId as XoNetwork['id'], 'network')
      if (network.$pool !== poolId) {
        throw invalidParameters(`network ${network.id} is not in pool ${poolId}`)
      }
      interfaceName = preferredInterface.name?.trim()
      if (!interfaceName) {
        throw invalidParameters('preferredInterface.name must not be empty')
      }
    }

    // undefined values are left out: the API method fills its own defaults
    const params: Record<string, unknown> = {
      disksByHost: usedDisksByHost,
      name: name_label.trim(),
      provisioning,
      replication,
    }
    if (name_description !== undefined) {
      params.description = name_description
    }
    if (force !== undefined) {
      params.force = force
    }
    if (ignoreFileSystems !== undefined) {
      params.ignoreFileSystems = ignoreFileSystems
    }
    if (preferredInterface !== undefined) {
      params.preferredInterface = { networkId: preferredInterface.networkId, name: interfaceName }
    }

    return params as XostorCreateParams
  }

  /**
   * Creates a XOSTOR (LINSTOR) SR on the hosts of a pool: installs the LINSTOR packages from the Fragata Host package
   * channel where they are missing, formats the disks and creates the shared SR. Returns the SR UUID.
   *
   * Goes through the `xostor.create` API method, which keeps its own permission (`admin`) and resolve checks.
   */
  createXostor(params: XostorCreateParams, opts?: { remoteAddress?: string }): Promise<XoSr['id']> {
    return this.#restApi.callApiMethod<XoSr['id']>('xostor.create', params, opts)
  }

  async delete(id: XoSr['id']): Promise<void> {
    const sr = this.#restApi.getObject<XoSr>(id, 'SR')
    const xapiSr = this.#restApi.getXapiObject<XoSr>(id, 'SR')
    const xapi = xapiSr.$xapi

    if (sr.SR_type === 'linstor') {
      // destroys the SR, then the LINSTOR volume group on every host of the pool
      await xapi.xostor_delete(xapiSr.$ref)
    } else {
      await xapi.destroySr(id)
    }
  }
}
