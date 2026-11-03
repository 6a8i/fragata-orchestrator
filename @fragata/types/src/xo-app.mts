import type { EventEmitter, Readable } from 'node:stream'
import type {
  AnyXoJob,
  AnyXoBackupJob,
  AnyXoLog,
  NonXapiXoRecord,
  XapiXoRecord,
  XoAuthenticationToken,
  XoBackupRepository,
  XoConfigBackupArchive,
  XoGroup,
  XoHost,
  XoNetwork,
  XoPlugin,
  XoPool,
  XoPoolBackupArchive,
  XoProxy,
  XoSchedule,
  XoServer,
  XoSr,
  XoTask,
  XoUser,
  XoVif,
  XoVm,
  XoVmBackupJob,
  XoVmBackupArchive,
  XoVmTemplate,
} from './xo.mjs'
import { VatesTask } from './lib/vates-task.mjs'
import type { PluginRestRouteDefinition } from './lib/rest-api.mjs'
import type { RPU_RECOVERY_STEP_NAME } from './common.mjs'
import {
  Xapi,
  XapiHostStats,
  XapiPoolStats,
  XapiStatsGranularity,
  XapiVmStats,
  XenApiGpuGroupWrapped,
  XenApiHostWrapped,
  XenApiMessageWrapped,
  XenApiNetworkWrapped,
  XenApiPbdWrapped,
  XenApiPciWrapped,
  XenApiPgpuWrapped,
  XenApiPifWrapped,
  XenApiPoolWrapped,
  XenApiSmWrapped,
  XenApiSrWrapped,
  XenApiVbdWrapped,
  XenApiVdiWrapped,
  XenApiVgpuTypeWrapped,
  XenApiVgpuWrapped,
  XenApiVifWrapped,
  XenApiVmWrapped,
  XenApiVtpmWrapped,
  XoAclBasePrivilege,
  XoAclRole,
  XoGroupRole,
  XoUserRole,
} from './index.mjs'

type FeatureCode =
  | 'BACKUP.DELTA'
  | 'BACKUP.DELTA_REPLICATION'
  | 'BACKUP.FULL'
  | 'BACKUP.HEALTHCHECK'
  | 'BACKUP.METADATA'
  | 'BACKUP.MIRROR'
  | 'BACKUP.WITH_RAM'
  | 'BACKUP.SMART_BACKUP'
  | 'BACKUP.S3'
  | 'DOCKER'
  | 'EXPORT.XVA'
  | 'LIST_MISSING_PATCHES'
  | 'POOL_EMERGENCY_SHUTDOWN'
  | 'RBAC'
  | 'ROLLING_POOL_UPDATE'
  | 'ROLLING_POOL_REBOOT'
  | 'SMART_REBOOT'
  | 'WARM_MIGRATION'
  | 'PLUGIN.OPENMETRICS'

type XapiRecordByXapiXoRecord = {
  gpuGroup: XenApiGpuGroupWrapped
  host: XenApiHostWrapped
  message: XenApiMessageWrapped
  network: XenApiNetworkWrapped
  PBD: XenApiPbdWrapped
  PCI: XenApiPciWrapped
  PGPU: XenApiPgpuWrapped
  PIF: XenApiPifWrapped
  pool: XenApiPoolWrapped
  SR: XenApiSrWrapped
  SM: XenApiSmWrapped
  VBD: XenApiVbdWrapped
  VDI: XenApiVdiWrapped
  'VDI-snapshot': XenApiVdiWrapped
  'VDI-unmanaged': XenApiVdiWrapped
  vgpu: XenApiVgpuWrapped
  vgpuType: XenApiVgpuTypeWrapped
  VIF: XenApiVifWrapped
  VM: XenApiVmWrapped
  'VM-controller': XenApiVmWrapped
  'VM-snapshot': XenApiVmWrapped
  'VM-template': XenApiVmWrapped
  VTPM: XenApiVtpmWrapped
}

type LicenseProductId =
  | 'premium'
  | 'xcpng-enterprise'
  | 'xcpng-standard'
  | 'fragata-proxy'
  | 'xosan.trial'
  | 'xostor'
  | 'xostor.trial'
type LicenseProductType = 'xo' | 'xoproxy' | 'xcpng' | 'xosan' | 'xostor'

type License = {
  id: string
  type: 'license'
  created: number
  licenseType: 'unit'
  productId: LicenseProductId
  tags: string[]
  expires?: number
  boundObjectId?: string
  bindDate?: number
  buyer?: { token: string; email: string }
  history?: { date: number; boundObjectId: string }[]
  rebound?: number
  productTypes?: LicenseProductType[]
  bundleInfo?: { name: string; id: string }
}

/** cloud-init template: user data, or network configuration when `type` is `network` */
export type XoCloudConfig = {
  id: string
  name: string
  template: string
  type?: 'network'
}

/** Self-service: what a set of users and groups may use and how much of it */
export type XoResourceSet = {
  id: string
  name: string
  /** users and groups allowed to use the set */
  subjects: string[]
  /** templates, SRs and networks the subjects can use */
  objects: string[]
  ipPools: string[]
  /** `cpus`, `memory` (bytes), `disk` (bytes) or `ipPool:<id>` → quota and current usage */
  limits: Record<string, { total?: number; usage: number }>
  /** new VMs are shared with every subject of the set */
  shareByDefault: boolean
  tags: string[]
}

/** IP addresses reserved for the VIFs of some networks */
export type XoIpPool = {
  id: string
  name: string
  /** address → the VIFs it is allocated to */
  addresses?: Record<string, { vifs?: string[] }>
  networks?: string[]
  resourceSets?: string[]
}

export type PoolRollingUpdateRecoveryStep = {
  status: 'pending' | 'running' | 'observed-succeeded' | 'failed' | 'not-needed'
  startedAt?: string
  finishedAt?: string
}

/** error serialized by the recovery recorder: secret-looking keys are redacted */
export type PoolRollingUpdateRecoveryError = {
  name?: string
  message?: string
  stack?: string
  code?: string | number
  [key: string]: unknown
}

export type PoolRollingUpdateRecoveryHost = {
  status: 'pending' | 'running' | 'succeeded' | 'failed' | 'not-needed'
  steps: Record<RPU_RECOVERY_STEP_NAME, PoolRollingUpdateRecoveryStep>
  lastError: PoolRollingUpdateRecoveryError | null
}

export type PoolRollingUpdateRecoveryRun = {
  runId: string
  poolId: string
  status: 'preparing' | 'running' | 'interrupted' | 'resuming' | 'failed' | 'cleaning' | 'succeeded'
  startedAt: string
  updatedAt: string
  finishedAt?: string
  interruptedAt?: string
  taskId?: string
  variant?: 'xcp' | 'xs-cdn'
  hostOrder?: string[]
  hosts: Record<string, PoolRollingUpdateRecoveryHost>
  lastError: PoolRollingUpdateRecoveryError | null
  /** VM UUID -> UUID of the host it must be started on */
  haltedPinnedVms: Record<string, string>
}

/** record unreadable or of an unknown schema version: recovery needs a human */
export type PoolRollingUpdateRecoveryBlocked = {
  poolId?: string
  runId?: string
  status: 'blocked'
  blockedReason: string
}

export type PoolRollingUpdateRecovery = PoolRollingUpdateRecoveryRun | PoolRollingUpdateRecoveryBlocked

/** A disk of a backup archive currently served as an iSCSI LUN */
export type BackupArchiveDiskMount = {
  /** Handle to pass to `unmountBackupArchiveDisk` */
  id: string
  /** UUID of the SR introduced on the host */
  srUuid: string
  /** UUID of the VDI exposing the backup disk, read-only unless it is cached */
  vdiUuid: string
  /** IQN of the target serving the disk */
  iqn: string
  /** Address of the portal, as advertised to the host */
  address: string
  /** Port of the portal (ephemeral, one target per mount) */
  port: number
}

type XoStoreRangeOptions = {
  gt?: string
  gte?: string
  lt?: string
  lte?: string
  limit?: number
  reverse?: boolean
}

export type XoApp = EventEmitter & {
  hooks: EventEmitter
  _redis: {
    get(key: string): Promise<string | null>
    mSet(args: string[]): Promise<unknown>
    sMembers(key: string): Promise<string[]>
    sIsMember(key: string, member: string): Promise<boolean>
  }
  config: {
    get<T = string>(path: string): T
    getOptional<T = unknown>(path: string): T | undefined
    getOptionalDuration(path: string): number | undefined
    getGuiRoutes(): Promise<{
      default: {
        url: string
        path: string
      }
      v5?: {
        url: string
        path: string
      }
      v6?: {
        url: string
        path: string
      }
      [key: string]:
        | undefined
        | {
            url: string
            path: string
          }
    }>
  }

  objects: EventEmitter & {
    allIndexes: {
      type: {
        getEventEmitterByType(type: XapiXoRecord['type']): EventEmitter
      }
    }
  }

  tasks: EventEmitter & {
    abort(id: XoTask['id'], reason?: string): Promise<void>
    clearLogs(): Promise<void>
    create: (params: { name: string; objectId?: string; type?: string }) => VatesTask
    deleteLog(id: XoTask['id']): Promise<void>
    get(id: XoTask['id']): Promise<XoTask>
    list(opts?: { filter?: string | ((obj: XoTask) => boolean); limit?: number }): AsyncGenerator<XoTask>
    watch(id: XoTask['id'], cb: (task: XoTask) => void): Promise<() => void>
  }
  apiContext: {
    user?: XoUser
    permission?: XoUser['permission'] | 'none' | null
  }
  backupLogsEe: EventEmitter

  // methods ------------
  allocIpAddresses(vifId: XoVif['id'], addAddresses?: string[], removeAddresses?: string[]): Promise<void>
  addAclV2GroupRole(groupId: XoGroup['id'], roleId: XoAclRole['id']): Promise<XoGroupRole>
  addAclV2UserRole(userId: XoUser['id'], roleId: XoAclRole['id']): Promise<XoUserRole>
  addUserToGroup: (userId: XoUser['id'], groupId: XoGroup['id']) => Promise<void>
  addApiMethod: <A extends unknown[], R>(
    name: string,
    method: (...args: A) => Promise<R>,
    //we use any since it is a legacy call, might be better typed in another pr
    info: {
      resolve?: any
      params?: any
    }
  ) => () => void // eslint-disable-line @typescript-eslint/no-explicit-any
  registerRestRoutes: (routes: PluginRestRouteDefinition[], base?: string) => () => void
  authenticateUser: (
    credentials: { token?: string; username?: string; password?: string },
    userData?: { ip?: string },
    opts?: { bypassOtp?: boolean; bypassTaskCreation?: boolean }
  ) => Promise<{ bypassOtp: boolean; expiration: number; user: XoUser }>
  backupGuard(objectId: XapiXoRecord['id'], opts?: { bypassBackupCheck?: boolean; operation: string }): Promise<void>
  /* Throw if no authorization */
  checkFeatureAuthorization(featureCode: FeatureCode): Promise<void>
  /* validate, apply and persist the configuration of a plugin */
  configurePlugin(id: string, configuration: unknown, mergeWithExisting?: boolean): Promise<void>
  /* connect a server (XCP-ng/XenServer) */
  connectXenServer(id: XoServer['id']): Promise<void>
  // TODO: replace all XoAclBasePrivilege with a more strict type. (discriminate union)
  createAclV2Privilege(
    privilege: Omit<XoAclBasePrivilege, 'id'>,
    options?: {
      force?: boolean
    }
  ): Promise<XoAclBasePrivilege>
  copyAclV2Role(
    id: XoAclRole['id'],
    params?: { name?: XoAclRole['name']; description?: XoAclRole['description'] }
  ): Promise<XoAclRole['id']>
  createAclV2Role(role: {
    name: XoAclRole['name']
    description?: XoAclRole['description']
    privileges?: Omit<XoAclBasePrivilege, 'id' | 'roleId'>[]
  }): Promise<XoAclRole>
  /**
   * Calls a JSON-RPC API method as the user bound to `connection` (`user_id`), with the method's own permission
   * and resolve checks
   */
  callApiMethod(
    connection: ReturnType<XoApp['createApiConnection']>,
    name: string,
    params?: Record<string, unknown>
  ): Promise<unknown>
  createApiConnection(remoteAddress: string): EventEmitter & {
    close(): void
    get<T = unknown>(key: string, defaultValue: unknown): T
    has(key: string): boolean
    set(key: string, value: unknown): void
    unset(key: string): void
  }
  createAuthenticationToken(opts: {
    client?: {
      id?: string
      [key: string]: unknown
    }
    description?: string
    expiresIn?: string | number
    userId: XoUser['id']
  }): Promise<XoAuthenticationToken>
  createBackupNgJob(
    type: 'backup',
    props: Omit<XoVmBackupJob, 'id' | 'type'>,
    /** keyed by a temporary id that is also the key of the matching entry in `props.settings` */
    schedules?: Record<string, { cron: string; enabled: boolean; name?: string; timezone?: string }>
  ): Promise<XoVmBackupJob>
  createSchedule(params: {
    cron: string
    enabled: boolean
    jobId: AnyXoJob['id']
    name?: string
    timezone?: string
    userId?: XoUser['id']
  }): Promise<XoSchedule>
  deleteBackupNgJob(id: AnyXoBackupJob['id'], type: AnyXoBackupJob['type']): Promise<void>
  runJobSequence(
    idSequence: AnyXoJob['id'][],
    schedule: XoSchedule,
    data?: { vms?: XoVm['id'][]; settings?: Record<string, unknown> }
  ): Promise<void>
  /** `null` values remove the property; `merge` false replaces the whole job */
  updateJob(job: { id: AnyXoJob['id']; [key: string]: unknown }, merge?: boolean): Promise<void>
  updateSchedule(params: {
    id: XoSchedule['id']
    cron?: string
    enabled?: boolean
    jobId?: AnyXoJob['id']
    name?: string
    timezone?: string
  }): Promise<void>
  createRemote(params: {
    name: string
    options?: string
    proxy?: XoProxy['id']
    url: string
  }): Promise<XoBackupRepository>
  createUser(params: {
    firstname?: string
    lastname?: string
    name?: string
    password?: string
    username?: string
    [key: string]: unknown
  }): Promise<XoUser>
  deleteAclV2GroupRole(
    groupId: XoGroup['id'],
    roleId: XoAclRole['id'],
    opts?: { bypassAuthorization?: boolean }
  ): Promise<boolean>
  deleteAclV2Privilege(privilegeId: XoAclBasePrivilege['id'], options?: { force?: boolean }): Promise<boolean>
  deleteAclV2Role(roleId: XoAclRole['id'], options?: { force?: boolean }): Promise<boolean>
  deleteGroup(id: XoGroup['id']): Promise<void>
  deleteUser(id: XoUser['id']): Promise<void>
  detachHostFromPool(hostId: XoHost['id']): Promise<void>
  createGroup(params: { name: string; provider?: string; providerGroup?: string }): Promise<XoGroup>
  disablePluginAutoload(id: XoPlugin['id']): Promise<void>
  /* disconnect a server (XCP-ng/XenServer) */
  disconnectXenServer(id: XoServer['id']): Promise<void>
  enablePluginAutoload(id: XoPlugin['id']): Promise<void>
  findEnabledScheduleSequenceFromSchedule(id: XoSchedule['id']): Promise<XoSchedule | undefined>
  getAclV2Privilege(id: XoAclBasePrivilege['id']): Promise<XoAclBasePrivilege>
  getAclV2Privileges(): Promise<XoAclBasePrivilege[]>
  getAclV2RolePrivileges(roleId: XoAclRole['id']): Promise<XoAclBasePrivilege[]>
  getAclV2Role(id: XoAclRole['id'], opts?: { bypassAuthorization?: boolean }): Promise<XoAclRole>
  deleteAclV2UserRole(
    userId: XoUser['id'],
    roleId: XoAclRole['id'],
    opts?: { bypassAuthorization?: boolean }
  ): Promise<boolean>
  deleteSchedule(id: XoSchedule['id']): Promise<void>
  getAclV2GroupRoles(
    groupId: XoGroup['id'],
    opts?: { bypassAuthorization?: boolean }
  ): Promise<Exclude<XoAclRole, { isTemplate: true }>[]>
  getAclV2Roles(): Promise<XoAclRole[]>
  getAclV2UserPrivileges(userId: XoUser['id']): Promise<XoAclBasePrivilege[]>
  getAclV2UserRoles(
    userId: XoUser['id'],
    opts?: { bypassAuthorization?: boolean; fromGroup?: boolean; fromUser?: boolean }
  ): Promise<XoAclRole[]>
  getAllGroups(): Promise<XoGroup[]>
  getAllProxies(): Promise<XoProxy[]>
  getAllJobs<T extends AnyXoJob['type']>(type: T): Promise<Extract<AnyXoJob, { type: T }>[]>
  getAllJobs(type?: string): Promise<AnyXoJob[]>
  getPlugin(id: XoPlugin['id']): Promise<XoPlugin>
  getPlugins(): Promise<XoPlugin[]>
  getProxy(id: XoProxy['id']): Promise<XoProxy>
  getRemote(id: XoBackupRepository['id']): Promise<XoBackupRepository>
  getAllRemotes(): Promise<XoBackupRepository[]>
  removeRemote(id: XoBackupRepository['id']): Promise<void>
  getAllRemotesInfo(): Promise<
    Record<
      XoBackupRepository['id'],
      {
        size?: number
        used?: number
        available?: number
        encryption?: {
          algorithm: string
          isLegacy: boolean
          recommanded: string
        }
      }
    >
  >
  getAllSchedules(): Promise<XoSchedule[]>
  getAllUsers(opts?: { obfuscatePassword?: boolean }): Promise<XoUser[]>
  getAllXenServers(): Promise<XoServer[]>
  createMetadataBackupJob(
    props: Record<string, unknown>,
    schedules: Record<string, { cron: string; enabled: boolean; name?: string; timezone?: string }>
  ): Promise<{ id: string }>
  /** copies the VM to the SR while it runs, then stops it for a last delta */
  warmMigrateVm(
    vmId: XoVm['id'],
    srId: XoSr['id'],
    startDestinationVm?: boolean,
    deleteSourceVm?: boolean
  ): Promise<void>
  /** partitions of a disk of a VM backup */
  listBackupNgDiskPartitions(
    remoteId: string,
    diskId: string
  ): Promise<{ id: string; name?: string; size?: number; type?: string }[]>
  /** entries of a directory of a partition, keyed by name (directories end with `/`) */
  listBackupNgPartitionFiles(
    remoteId: string,
    diskId: string,
    partitionId: string | undefined,
    path: string
  ): Promise<Record<string, object>>
  /** an archive (`zip` or `tgz`) of files of a partition */
  fetchBackupNgPartitionFiles(
    remoteId: string,
    diskId: string,
    partitionId: string | undefined,
    paths: string[],
    format: 'zip' | 'tgz'
  ): Promise<Readable>
  /** the master of the source pool joins the target pool; the connection of the source pool is forgotten */
  mergeXenPools(sourcePoolId: XoPool['id'], targetPoolId: XoPool['id'], force?: boolean): Promise<void>
  /** VMs of a VMware ESXi or vCenter host */
  connectToEsxiAndList(opts: { host: string; user: string; password: string; sslVerify?: boolean }): Promise<
    {
      id: string
      nameLabel: string
      memory: number
      nCpus: number
      firmware: string
      powerState: string
      hasAllExtentsListed: boolean
      storage: { used: number; free: number }
    }[]
  >
  /** resolves to the UUID of the new VM */
  migrationfromEsxi(opts: {
    host: string
    user: string
    password: string
    sslVerify?: boolean
    vm: string
    sr: XoSr['id']
    network: XoNetwork['id']
    template: XoVmTemplate['id']
    stopSource?: boolean
  }): Promise<string>
  /** writes an OVA stream to a temporary file, `dispose` removes it */
  storeOvaInTmp(stream: Readable, opts?: { fileName?: string }): Promise<{ path: string; dispose(): Promise<void> }>
  /** imports the VM of a local OVA file, resolves to the UUID of the new VM */
  importOvaFile(
    path: string,
    opts: {
      sr: XoSr['id']
      /** network of all the VIFs of the OVF, the management network of the pool by default */
      network?: XoNetwork['id']
      /** one network per VIF, replaces the VIFs of the OVF */
      networks?: XoNetwork['id'][]
      nameLabel?: string
      descriptionLabel?: string
      nCpus?: number
      /** bytes */
      memory?: number
      fileName?: string
    }
  ): Promise<string>
  updateXenServer(
    id: XoServer['id'],
    props: {
      label?: string | null
      host?: string
      username?: string
      password?: string
      allowUnauthorized?: boolean
      readOnly?: boolean
      httpProxy?: string | null
    }
  ): Promise<void>
  /** a Buffer: JSON, gzipped when `compress`, OpenPGP-encrypted with the passphrase when given */
  exportConfig(opts?: { compress?: boolean; entries?: string[]; passphrase?: string }): Promise<Buffer | string>
  importConfig(config: Buffer, opts?: { passphrase?: string }): Promise<void>
  getConfiguredTags(): Promise<{ id: string; color?: string }[]>
  /** `null` removes the color */
  setTag(id: string, props: { color?: string | null }): Promise<void>
  getAllCloudConfigs(): Promise<XoCloudConfig[]>
  getAllNetworkConfigs(): Promise<XoCloudConfig[]>
  getCloudConfig(id: string): Promise<XoCloudConfig>
  createCloudConfig(props: { name: string; template: string; type?: 'network' }): Promise<XoCloudConfig>
  updateCloudConfig(props: { id: string; name?: string; template?: string }): Promise<void>
  deleteCloudConfig(id: string): Promise<void>
  /** resolves to the id of the new IP pool */
  createIpPool(props: { addresses?: Record<string, object>; name: string; networks?: string[] }): Promise<string>
  deleteIpPool(id: string): Promise<void>
  /** without `userId`, every IP pool */
  getAllIpPools(userId?: string): Promise<XoIpPool[]>
  getIpPool(id: string): Promise<XoIpPool>
  /** `null` as an address value removes it */
  updateIpPool(
    id: string,
    props: { addresses?: Record<string, object | null>; name?: string; networks?: string[] }
  ): Promise<void>
  getAuthenticationTokensForUser(userId: XoUser['id']): Promise<XoAuthenticationToken[]>
  deleteAuthenticationToken(id: XoAuthenticationToken['id'] | string): Promise<void>
  /** Archive/host a live-mounted disk belongs to, as recorded by `mountBackupArchiveDisk` */
  getBackupArchiveDiskMountOwner(id: BackupArchiveDiskMount['id']): {
    archiveId: XoVmBackupArchive['id']
    hostId: XoHost['id']
    /** set when the disk is served by a proxy instead of this appliance */
    proxyId?: XoProxy['id']
  }
  getBackupNgLogs(): Promise<Record<string, AnyXoLog>>
  getBackupNgLogs(id: AnyXoLog['id']): Promise<AnyXoLog>
  /** Please use `REMOVE_CACHE_ENTRY` const to clear the cache */
  getBackupNgLogs(removeCacheEntry: {}): void
  /** Please use `REMOVE_CACHE_ENTRY` const to clear a cache entry */
  getBackupNgLogs(removeCacheEntry: {}, id: AnyXoLog['id']): void
  getBackupNgLogsSorted(opts: {
    after?: number
    before?: number
    filter: (log: AnyXoLog) => boolean
    limit?: number
  }): Promise<AnyXoLog[]>
  getGroup(id: XoGroup['id']): Promise<XoGroup>
  getHVSupportedVersions: undefined | (() => Promise<{ [key: XoHost['productBrand']]: string }>)
  getJob<T extends AnyXoJob>(id: T['id']): Promise<T>
  isJobSequence(job: AnyXoJob): boolean
  getObject: <T extends XapiXoRecord>(id: T['id'], type?: T['type'] | T['type'][]) => T
  getObjectsByType: <T extends XapiXoRecord>(
    type: T['type'],
    opts?: { filter?: string | ((obj: T) => boolean); limit?: number }
  ) => Record<T['id'], T> | undefined
  getTotalBackupSizeOnRemote(id: XoBackupRepository['id']): Promise<{ onDisk: number }>
  getSchedule(id: XoSchedule['id']): Promise<XoSchedule>
  /** log entries of a namespace (`api` holds the failed API calls), by id */
  getLogs(
    namespace: string
  ): Promise<
    Record<string, { level: string; message: string; data?: Record<string, unknown>; namespace: string; time: number }>
  >
  getLogger(namespace: string): Promise<{ del(id: string | string[]): void }>
  getStore(namespace: string): Promise<{
    /** rejects with an error having `notFound: true` when the key does not exist */
    get(key: string): Promise<unknown>
    has(key: string): Promise<boolean>
    put(key: string, value: unknown): Promise<void>
    del(key: string): Promise<void>
    del(key: string, cb: (error?: Error | null) => void): void
    /** object mode stream of `{ key, value }` */
    createReadStream(opts?: XoStoreRangeOptions): Readable
    /** object mode stream of keys */
    createKeyStream(opts?: XoStoreRangeOptions): Readable
  }>
  getUser: (id: XoUser['id'], opts?: { obfuscatePassword?: boolean }) => Promise<XoUser>
  getUserIdentityFields(): string[]
  getXapi(maybeId: XapiXoRecord['id'] | XapiXoRecord): Xapi
  getXapiHostStats: (hostId: XoHost['id'], granularity?: XapiStatsGranularity) => Promise<XapiHostStats>
  getXapiObject: <T extends XapiXoRecord>(
    maybeId: T['id'] | T,
    type: T['type'] | T['type'][]
  ) => XapiRecordByXapiXoRecord[T['type']]
  getXapiPoolStats(poolId: XoPool['id'], granularity?: XapiStatsGranularity): Promise<XapiPoolStats>
  getXapiVmStats: (vmId: XoVm['id'], granularity?: XapiStatsGranularity) => Promise<XapiVmStats>
  getXenServer(id: XoServer['id']): Promise<XoServer>
  /** the connection of the pool holding this object, which may not be connected */
  getXenServerIdByObject<T extends XapiXoRecord>(maybeId: T['id'] | T, type?: T['type'] | T['type'][]): XoServer['id']
  getXenServerWithCredentials(id: XoServer['id']): Promise<XoServer & { password: string }>
  getXoEventEmitterByType(type: string): EventEmitter
  hasFeatureAuthorization(featureCode: string): Promise<boolean>
  hasObject<T extends XapiXoRecord>(id: T['id'], type: T['type']): boolean
  loadPlugin(id: XoPlugin['id']): Promise<void>
  restoreMetadataBackup(opts: { id: string; poolUuid?: string }): Promise<void>
  listMetadataBackups(backupRepositoryIds: XoBackupRepository['id'][]): Promise<{
    xo: Record<XoBackupRepository['id'], XoConfigBackupArchive[]>
    pool: Record<XoBackupRepository['id'], Record<XoPool['id'], XoPoolBackupArchive[]>>
  }>
  /** restores the VM of a backup archive on `srId`, resolves with the id of the new VM */
  importVmBackupNg(
    id: XoVmBackupArchive['id'],
    srId: XoSr['id'],
    settings?: {
      additionalVmTag?: string
      mapVdisSrs?: Record<string, string>
      newMacAddresses?: boolean
      useDifferentialRestore?: boolean
      vmNamePrefix?: string
    }
  ): Promise<XoVm['id']>
  /** `null` when the listing of a backup repository failed */
  listVmBackupsNg(
    backupRepositoryIds: XoBackupRepository['id'][],
    opts?: { _forceRefresh?: boolean; vmId?: XoVm['id'] }
  ): Promise<Record<XoBackupRepository['id'], Record<XoVm['id'], XoVmBackupArchive[]> | null>>
  /**
   * Serve one disk of a backup archive as an iSCSI LUN and attach it to `host`
   * as an SR, read-only unless `cacheSrId` is set. Undone by `unmountBackupArchiveDisk`.
   *
   * The LUN is served by whoever can read the backup repository: this appliance, or the proxy the
   * repository is linked to.
   */
  mountBackupArchiveDisk(params: {
    archiveId: XoVmBackupArchive['id']
    /**
     * SR of a VDI of the serving appliance, which the disk is materialized into as it is read and
     * which holds the writes; unset, nothing is cached and the mount is read-only. On a local SR,
     * the serving appliance must not be migrated while the mount lasts: the VDI cannot follow it
     */
    cacheSrId?: XoSr['id']
    /** One of the archive's `disks[].id` */
    diskId: string
    hostId: XoHost['id']
  }): Promise<BackupArchiveDiskMount>
  purgePluginConfiguration(id: XoPlugin['id']): Promise<void>
  pingRemote(id: XoBackupRepository['id']): Promise<{ success: true }>
  /**
   * Record the live mounts a proxy created by itself, while running a restore: they never went
   * through `mountBackupArchiveDisk`, so nothing else knows which proxy serves them.
   */
  registerProxyBackupArchiveDiskMounts(params: {
    archiveId: XoVmBackupArchive['id']
    /** as reported by the restore, each with the host it is attached to */
    mounts: { id: BackupArchiveDiskMount['id']; hostId: XoHost['id'] }[]
    proxyId: XoProxy['id']
  }): void
  /** Allow to add a new server in the DB (XCP-ng/XenServer) */
  registerXenServer(
    body: Pick<XoServer, 'host' | 'httpProxy' | 'label' | 'username'> & {
      allowUnauthorized?: XoServer['allowUnauthorized']
      password: string
      readOnly?: XoServer['readOnly']
    }
  ): Promise<XoServer>
  rollingPoolReboot(
    pool: XoPool,
    opts?: { bypassBackupCheck?: boolean; parentTask?: VatesTask; shutdownPinnedVms?: boolean }
  ): Promise<void>
  rollingPoolUpdate(
    pool: XoPool,
    opts?: {
      acceptCurrentStateAsBaseline?: boolean
      bypassBackupCheck?: boolean
      rebootVm?: boolean
      parentTask?: VatesTask
      shutdownPinnedVms?: boolean
    }
  ): Promise<void>
  getRollingUpdateRecovery(poolId: XoPool['id']): Promise<PoolRollingUpdateRecovery | undefined>
  finalizeRollingUpdate(pool: XoPool, opts?: { force?: boolean; parentTask?: VatesTask }): Promise<void>
  createResourceSet(
    name: string,
    subjects?: string[],
    objects?: string[],
    limits?: Record<string, number>,
    shareByDefault?: boolean,
    tags?: string[]
  ): Promise<XoResourceSet>
  deleteResourceSet(id: string): Promise<void>
  /** with a `userId`, only the sets that user is a subject of (directly or through a group), unless admin */
  getAllResourceSets(userId?: string): Promise<XoResourceSet[]>
  getResourceSet(id: string): Promise<XoResourceSet>
  recomputeResourceSetsLimits(): Promise<void>
  updateResourceSet(
    id: string,
    props: {
      name?: string
      shareByDefault?: boolean
      subjects?: string[]
      objects?: string[]
      tags?: string[]
      limits?: Record<string, number>
      ipPools?: string[]
    }
  ): Promise<void>
  /** throws `unauthorized` when the user is not a subject of the set, or (with `objectIds`) an object is not in it */
  checkResourceSetConstraints(id: string, userId: XoUser['id'], objectIds?: string[]): Promise<void>
  setVmResourceSet(vmId: XoVm['id'], resourceSetId: string | null, force?: boolean): Promise<void>
  shareVmResourceSet(vmId: XoVm['id']): Promise<void>
  removeUserFromGroup(userId: XoUser['id'], id: XoGroup['id']): Promise<void>
  runJob(job: AnyXoJob, schedule: XoSchedule): void
  runWithApiContext: (user: XoUser | undefined, fn: () => void) => Promise<unknown>
  testPlugin(id: XoPlugin['id'], data?: unknown): Promise<void>
  testRemote(
    id: XoBackupRepository['id']
  ): Promise<
    | { success: true; readRate: number; writeRate: number }
    | { success: false; step: string; file: string; error: unknown }
  >
  touchXoObject(type: string, id: NonXapiXoRecord['id']): Promise<void>
  /** Detach a disk mounted by `mountBackupArchiveDisk` and stop serving it */
  unmountBackupArchiveDisk(id: BackupArchiveDiskMount['id']): Promise<void>
  unloadPlugin(id: XoPlugin['id']): Promise<void>
  reclaimSpace(
    remoteId: XoBackupRepository['id'],
    opts?: { vmUuid?: XoVm['id']; merge?: boolean; remove?: boolean }
  ): Promise<{ vmUuid: string; success: boolean; merge?: boolean; size?: number; error?: string }[]>
  /** Remove a server from the DB (XCP-ng/XenServer) */
  unregisterXenServer(id: XoServer['id']): Promise<void>
  updateUser(
    id: XoUser['id'],
    updates: {
      email?: string
      authProviders?: Record<string, string>
      firstname?: string
      lastname?: string
      /**
       * @deprecated
       */
      name?: string
      password?: string
      permission?: string
      preferences?: Record<string, string>
      username?: string
    }
  ): Promise<void>
  updateAclV2Privilege(
    privilegeId: XoAclBasePrivilege['id'],
    privilege: XoAclBasePrivilege
  ): Promise<XoAclBasePrivilege>
  updateAclV2Role(
    roleId: XoAclRole['id'],
    role: {
      name?: XoAclRole['name']
      description?: XoAclRole['description'] | null
    },
    options?: {
      force?: boolean
    }
  ): Promise<XoAclRole>
  updateGroup(
    id: XoGroup['id'],
    updates: {
      name?: string
    }
  ): void
  updateRemote(
    id: XoBackupRepository['id'],
    params: {
      enabled?: boolean
      name?: string
      options?: string | null
      proxy?: XoProxy['id'] | null
      url?: string
    }
  ): Promise<XoBackupRepository>
  getAllXapis(): Record<string, Xapi>
  getObjects(opts?: { filter?: Record<string, unknown>; limit?: number }): Record<string, XapiXoRecord>
  getLicenses(params?: { productType?: LicenseProductType }): Promise<License[]>
  bindLicense(params: { licenseId: string; boundObjectId: string }): Promise<License>
  unbindLicense(params: {
    productId: LicenseProductId
    boundObjectId: string
    licenseId: string
    data?: Record<string, string>
  }): Promise<License>
}
