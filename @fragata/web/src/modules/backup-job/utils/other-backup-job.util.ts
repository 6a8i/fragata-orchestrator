export type OtherBackupJobKind = 'metadata' | 'mirror'

export type OtherBackupJobForm = {
  name: string
  /** ids of the backup repositories written to */
  remoteIds: string[]
  retention: number
  cron: string
  /** metadata */
  poolIds: string[]
  xoMetadata: boolean
  /** mirror */
  mode: 'full' | 'delta'
  sourceRemoteId?: string
}

const TMP_SCHEDULE_ID = 'schedule'

const RETENTION_SETTINGS = ['exportRetention', 'retentionXoMetadata', 'retentionPoolMetadata']

/** complex-matcher pattern matching these ids */
export function idsPattern(ids: string[]) {
  return { id: { __or: ids } }
}

/** ids matched by a pattern made by `idsPattern` (or a plain `{ id }` one) */
export function idsOfPattern(pattern: unknown): string[] {
  const id = (pattern as { id?: unknown } | undefined)?.id
  if (typeof id === 'string') {
    return [id]
  }
  const or = (id as { __or?: unknown } | undefined)?.__or
  return Array.isArray(or) ? or.filter((value): value is string => typeof value === 'string') : []
}

function retentionSettings(kind: OtherBackupJobKind, form: OtherBackupJobForm) {
  if (kind === 'mirror') {
    return { exportRetention: form.retention }
  }
  return {
    ...(form.xoMetadata && { retentionXoMetadata: form.retention }),
    ...(form.poolIds.length > 0 && { retentionPoolMetadata: form.retention }),
  }
}

/** body of `POST /backup-jobs/{metadata,mirror}`: the job and one schedule */
export function toCreateBody(kind: OtherBackupJobKind, form: OtherBackupJobForm) {
  const common = {
    name: form.name,
    remotes: idsPattern(form.remoteIds),
    settings: { '': {}, [TMP_SCHEDULE_ID]: retentionSettings(kind, form) },
    schedules: { [TMP_SCHEDULE_ID]: { cron: form.cron, enabled: true, name: form.name } },
  }
  if (kind === 'mirror') {
    return { ...common, mode: form.mode, sourceRemote: form.sourceRemoteId }
  }
  return {
    ...common,
    xoMetadata: form.xoMetadata,
    ...(form.poolIds.length > 0 && { pools: idsPattern(form.poolIds) }),
  }
}

/** body of `PATCH /backup-jobs/{metadata,mirror}/{id}`: the retention goes to every schedule of the job */
export function toUpdateBody(
  kind: OtherBackupJobKind,
  form: OtherBackupJobForm,
  settings: Record<string, Record<string, unknown>>
) {
  const newSettings: Record<string, Record<string, unknown>> = { '': settings[''] ?? {} }
  for (const [key, value] of Object.entries(settings)) {
    if (key !== '') {
      const rest = Object.fromEntries(Object.entries(value).filter(([name]) => !RETENTION_SETTINGS.includes(name)))
      newSettings[key] = { ...rest, ...retentionSettings(kind, form) }
    }
  }
  const common = { name: form.name, remotes: idsPattern(form.remoteIds), settings: newSettings }
  if (kind === 'mirror') {
    return { ...common, mode: form.mode, sourceRemote: form.sourceRemoteId }
  }
  return { ...common, xoMetadata: form.xoMetadata, pools: form.poolIds.length > 0 ? idsPattern(form.poolIds) : null }
}

/** retention of a job: the one of its first schedule */
export function retentionOf(kind: OtherBackupJobKind, settings: Record<string, Record<string, unknown>> = {}) {
  const first = Object.entries(settings).find(([key]) => key !== '')?.[1] ?? {}
  const value = kind === 'mirror' ? first.exportRetention : (first.retentionXoMetadata ?? first.retentionPoolMetadata)
  return typeof value === 'number' ? value : 7
}
