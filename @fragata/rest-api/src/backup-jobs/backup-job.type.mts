import type {
  XoVmBackupJob,
  XoVmBackupJobGeneralSettings,
  XoVmBackupJobScheduleSettings,
  XoMetadataBackupJob,
  XoMirrorBackupJob,
  XoMetadataBackupJobGeneralSettings,
  XoMetadataBackupJobScheduleSettings,
  XoMirrorBackupGeneralSettings,
  XoMirrorBackupScheduleSettings,
} from '@fragata/types'
import { Unbrand } from '../open-api/common/response.common.mjs'
import type * as CMType from '@fragata/types/lib/complex-matcher'

type UnbrandedXoVmBackupJob = Omit<XoVmBackupJob, 'settings' | 'remotes' | 'vms' | 'srs'> & {
  remotes?: CMType.IdOr<string>
  vms: CMType.IdOr<string> | Record<string, unknown>
  srs?: CMType.IdOr<string>
  settings: {
    '': XoVmBackupJobGeneralSettings
    [scheduleId: string]: Unbrand<XoVmBackupJobScheduleSettings> | undefined
  }
}
export type UnbrandXoVmBackupJob = Unbrand<UnbrandedXoVmBackupJob>

type UnbrandedXoMetadataBackupJob = Omit<XoMetadataBackupJob, 'settings' | 'pools' | 'remotes'> & {
  pools?: CMType.IdOr<string>
  remotes: CMType.IdOr<string>
  settings: {
    ''?: XoMetadataBackupJobGeneralSettings
    [scheduleId: string]: XoMetadataBackupJobScheduleSettings | undefined
  }
}
export type UnbrandXoMetadataBackupJob = Unbrand<UnbrandedXoMetadataBackupJob>

type UnbrandedXoMirrorBackupJob = Omit<XoMirrorBackupJob, 'settings' | 'remotes'> & {
  remotes: CMType.IdOr<string>
  settings: {
    '': XoMirrorBackupGeneralSettings
    [scheduleId: string]: Unbrand<XoMirrorBackupScheduleSettings> | undefined
  }
}
export type UnbrandXoMirrorBackupJob = Unbrand<UnbrandedXoMirrorBackupJob>

export type UnbrandAnyXoBackupJob = UnbrandXoVmBackupJob | UnbrandXoMetadataBackupJob | UnbrandXoMirrorBackupJob

export type VmBackupJobScheduleBody = {
  cron: string
  enabled: boolean
  name?: string
  timezone?: string
}

export type CreateVmBackupJobBody = {
  name?: string
  mode: 'full' | 'delta'
  compression?: '' | 'native' | 'zstd'
  proxy?: string
  /** complex-matcher pattern, e.g. `{ "id": { "__or": ["<id>", "<id>"] } }` */
  remotes?: Record<string, unknown>
  /** complex-matcher pattern, e.g. `{ "id": { "__or": ["<id>", "<id>"] } }` */
  srs?: Record<string, unknown>
  /** complex-matcher pattern, e.g. `{ "id": { "__or": ["<id>", "<id>"] } }` */
  vms: Record<string, unknown>
  /** `''` holds the general settings, the other keys are schedule ids (or temporary ids, see `schedules`) */
  settings: Record<string, Record<string, unknown>>
  /** schedules to create with the job, keyed by a temporary id matching their entry in `settings` */
  schedules?: Record<string, VmBackupJobScheduleBody>
}

export type UpdateVmBackupJobBody = Partial<Omit<CreateVmBackupJobBody, 'schedules' | 'proxy'>> & {
  /** `null` removes the proxy */
  proxy?: string | null
}

export type RunBackupJobBody = {
  /** defaults to the first schedule of the job */
  scheduleId?: string
  /** restrict the run to these VMs */
  vms?: string[]
}

export type CreateMetadataBackupJobBody = {
  name?: string
  proxy?: string
  /** complex-matcher pattern of the backup repositories, e.g. `{ "id": { "__or": ["<id>"] } }` */
  remotes: Record<string, unknown>
  /** complex-matcher pattern of the pools whose metadata is saved */
  pools?: Record<string, unknown>
  /** saves the configuration of the orchestrator */
  xoMetadata?: boolean
  /** `''` holds the general settings, the other keys are schedule ids (or temporary ids, see `schedules`) */
  settings: Record<string, Record<string, unknown>>
  schedules?: Record<string, VmBackupJobScheduleBody>
}

export type UpdateMetadataBackupJobBody = Partial<
  Omit<CreateMetadataBackupJobBody, 'schedules' | 'proxy' | 'pools'>
> & {
  /** `null` removes the proxy */
  proxy?: string | null
  /** `null` stops saving the pools */
  pools?: Record<string, unknown> | null
}

export type CreateMirrorBackupJobBody = {
  name?: string
  mode: 'full' | 'delta'
  proxy?: string
  /** backup repository copied from */
  sourceRemote: string
  /** complex-matcher pattern of the backup repositories copied to */
  remotes: Record<string, unknown>
  /** restricts the copy to some VMs, e.g. `{ "vm": { "uuid": { "__or": ["<uuid>"] } } }` */
  filter?: Record<string, unknown>
  settings: Record<string, Record<string, unknown>>
  schedules?: Record<string, VmBackupJobScheduleBody>
}

export type UpdateMirrorBackupJobBody = Partial<Omit<CreateMirrorBackupJobBody, 'schedules'>>
