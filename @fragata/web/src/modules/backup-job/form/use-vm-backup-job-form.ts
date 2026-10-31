import type { FrontXoVmBackupJob } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import {
  type FrontXoBackupRepository,
  useXoBackupRepositoryCollection,
} from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import type { FrontXoSchedule } from '@/modules/schedule/remote-resources/use-xo-schedule-collection.ts'
import { type FrontXoSr, useXoSrCollection } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { type FrontXoVm, useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { type FormValidationConfig, minLength, minValue, required, withMessage } from '@core/packages/form-validation'
import { useValidatedForm } from '@core/packages/validated-form'
import { extractIdsFromSimplePattern } from '@fragata/backups/extractIdsFromSimplePattern.mjs'
import { computed, reactive } from 'vue'
import { useI18n } from 'vue-i18n'

export type VmBackupJobMode = FrontXoVmBackupJob['mode']
export type VmBackupJobCompression = NonNullable<FrontXoVmBackupJob['compression']>
export type VmBackupJobReportWhen = 'always' | 'failure' | 'error' | 'never'

export type VmBackupJobFormData = {
  name: string
  mode: VmBackupJobMode
  compression: VmBackupJobCompression
  reportWhen: VmBackupJobReportWhen
  vmIds: FrontXoVm['id'][]
  backupRepositoryIds: FrontXoBackupRepository['id'][]
  srIds: FrontXoSr['id'][]
  exportRetention: number
  copyRetention: number
  snapshotRetention: number
  fullInterval: number | undefined
  scheduleName: string
  cron: string
  timezone: string
  scheduleEnabled: boolean
}

type IdPattern<T extends string> = { id: { __or: T[] } }

export type VmBackupJobPayload = {
  job: {
    name: string
    mode: VmBackupJobMode
    compression: VmBackupJobCompression
    vms: IdPattern<FrontXoVm['id']>
    remotes?: IdPattern<FrontXoBackupRepository['id']>
    srs?: IdPattern<FrontXoSr['id']>
  }
  generalSettings: Record<string, unknown>
  scheduleSettings: {
    exportRetention?: number
    copyRetention?: number
    snapshotRetention?: number
    fullInterval?: number
  }
  schedule: {
    name?: string
    cron: string
    enabled: boolean
    timezone?: string
  }
}

export type VmBackupJobFormInitialData = {
  backupJob: FrontXoVmBackupJob
  schedule?: FrontXoSchedule
}

export const DEFAULT_CRON = '0 0 * * *'

function toIdPattern<T extends string>(ids: T[]): IdPattern<T> {
  return { id: { __or: ids } }
}

function idsFromPattern<T extends string>(pattern: unknown): T[] {
  try {
    return extractIdsFromSimplePattern(pattern) as T[]
  } catch {
    // smart mode patterns (by tag or pool) cannot be edited in this form yet
    return []
  }
}

function toNumber(value: unknown, fallback: number): number {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

export type VmBackupJobForm = ReturnType<typeof useVmBackupJobForm>

export function useVmBackupJobForm(initialData?: VmBackupJobFormInitialData) {
  const { t } = useI18n()

  const { vms } = useXoVmCollection()
  const { backupRepositories } = useXoBackupRepositoryCollection()
  const { srs } = useXoSrCollection()

  const initialJob = initialData?.backupJob
  const initialSchedule = initialData?.schedule
  const initialGeneralSettings = (initialJob?.settings[''] ?? {}) as Record<string, unknown>
  const initialScheduleSettings = (
    initialSchedule !== undefined ? (initialJob?.settings[initialSchedule.id] ?? {}) : {}
  ) as Record<string, unknown>

  const formData = reactive<VmBackupJobFormData>({
    name: initialJob?.name ?? '',
    mode: initialJob?.mode ?? 'delta',
    compression: initialJob?.compression ?? '',
    reportWhen: (initialGeneralSettings.reportWhen as VmBackupJobReportWhen | undefined) ?? 'failure',
    vmIds: idsFromPattern<FrontXoVm['id']>(initialJob?.vms),
    backupRepositoryIds: idsFromPattern<FrontXoBackupRepository['id']>(initialJob?.remotes),
    srIds: idsFromPattern<FrontXoSr['id']>(initialJob?.srs),
    exportRetention: toNumber(initialScheduleSettings.exportRetention, 1),
    copyRetention: toNumber(initialScheduleSettings.copyRetention, 0),
    snapshotRetention: toNumber(initialScheduleSettings.snapshotRetention, 0),
    fullInterval:
      initialScheduleSettings.fullInterval === undefined
        ? undefined
        : toNumber(initialScheduleSettings.fullInterval, 0),
    scheduleName: initialSchedule?.name ?? '',
    cron: initialSchedule?.cron ?? DEFAULT_CRON,
    timezone: initialSchedule?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
    scheduleEnabled: initialSchedule?.enabled ?? true,
  })

  const config: FormValidationConfig<VmBackupJobFormData> = {
    errors: {
      onSubmit: () => ({
        name: { required },
        vmIds: { minLength: withMessage(minLength(1), () => t('job:backup-job:vms-required')) },
        cron: { required },
        exportRetention: { minValue: minValue(0) },
        copyRetention: { minValue: minValue(0) },
        snapshotRetention: { minValue: minValue(0) },
      }),
    },
  }

  const { useField, useFormSelect, useSelect, validate } = useValidatedForm(formData, config)

  const modeOptions = computed(() => [
    { id: 'delta', label: t('incremental'), value: 'delta' as const },
    { id: 'full', label: t('full'), value: 'full' as const },
  ])

  const { id: modeSelectId } = useFormSelect('mode', modeOptions, {
    required: true,
    option: { label: 'label', value: 'value' },
  })

  const compressionOptions = computed(() => [
    { id: 'none', label: t('none'), value: '' as const },
    { id: 'native', label: t('native'), value: 'native' as const },
    { id: 'zstd', label: t('zstd'), value: 'zstd' as const },
  ])

  const { id: compressionSelectId } = useFormSelect('compression', compressionOptions, {
    required: true,
    option: { label: 'label', value: 'value' },
  })

  const reportWhenOptions = computed(() => [
    { id: 'failure', label: t('report-when:failure'), value: 'failure' as const },
    { id: 'error', label: t('report-when:error'), value: 'error' as const },
    { id: 'always', label: t('report-when:always'), value: 'always' as const },
    { id: 'never', label: t('report-when:never'), value: 'never' as const },
  ])

  const { id: reportWhenSelectId } = useFormSelect('reportWhen', reportWhenOptions, {
    required: true,
    option: { label: 'label', value: 'value' },
  })

  const { id: vmsSelectId } = useFormSelect('vmIds', vms, {
    multiple: true,
    searchable: true,
    required: true,
    option: { label: 'name_label', value: 'id' },
  })

  const { id: backupRepositoriesSelectId } = useFormSelect('backupRepositoryIds', backupRepositories, {
    multiple: true,
    searchable: true,
    option: { label: 'name', value: 'id' },
  })

  const { id: srsSelectId } = useFormSelect('srIds', srs, {
    multiple: true,
    searchable: true,
    option: { label: 'name_label', value: 'id' },
  })

  const hasBackupRepositories = computed(() => formData.backupRepositoryIds.length > 0)
  const hasReplicationTargets = computed(() => formData.srIds.length > 0)

  const bindings = reactive({
    name: useField('name', () => ({ label: t('name'), required: true })),
    mode: useSelect(modeSelectId, () => ({ label: t('mode') })),
    compression: useSelect(compressionSelectId, () => ({ label: t('compression') })),
    reportWhen: useSelect(reportWhenSelectId, () => ({ label: t('report-when') })),
    vms: useSelect(vmsSelectId, () => ({ label: t('vms') })),
    backupRepositories: useSelect(backupRepositoriesSelectId, () => ({ label: t('backup-repositories') })),
    srs: useSelect(srsSelectId, () => ({ label: t('replication-targets') })),
    exportRetention: useField('exportRetention', () => ({ label: t('backup-retention') })),
    copyRetention: useField('copyRetention', () => ({ label: t('replication-retention') })),
    snapshotRetention: useField('snapshotRetention', () => ({ label: t('snapshot-retention') })),
    fullInterval: useField('fullInterval', () => ({ label: t('full-backup-interval') })),
    scheduleName: useField('scheduleName', () => ({ label: t('schedule-name') })),
    cron: useField('cron', () => ({ label: t('cron-pattern'), required: true })),
    timezone: useField('timezone', () => ({ label: t('timezone') })),
    scheduleEnabled: useField('scheduleEnabled', () => ({ label: t('enabled') })),
  })

  async function validateAndBuildPayload(): Promise<VmBackupJobPayload | undefined> {
    if (!(await validate())) {
      return undefined
    }

    const scheduleSettings: VmBackupJobPayload['scheduleSettings'] = {
      snapshotRetention: toNumber(formData.snapshotRetention, 0),
    }

    if (hasBackupRepositories.value) {
      scheduleSettings.exportRetention = toNumber(formData.exportRetention, 0)
    }

    if (hasReplicationTargets.value) {
      scheduleSettings.copyRetention = toNumber(formData.copyRetention, 0)
    }

    if (formData.mode === 'delta' && formData.fullInterval !== undefined && formData.fullInterval !== null) {
      const fullInterval = toNumber(formData.fullInterval, 0)
      if (fullInterval > 0) {
        scheduleSettings.fullInterval = fullInterval
      }
    }

    return {
      job: {
        name: formData.name,
        mode: formData.mode,
        compression: formData.compression,
        vms: toIdPattern(formData.vmIds),
        ...(hasBackupRepositories.value && { remotes: toIdPattern(formData.backupRepositoryIds) }),
        ...(hasReplicationTargets.value && { srs: toIdPattern(formData.srIds) }),
      },
      generalSettings: {
        ...initialGeneralSettings,
        reportWhen: formData.reportWhen,
      },
      scheduleSettings,
      schedule: {
        name: formData.scheduleName,
        cron: formData.cron.trim(),
        enabled: formData.scheduleEnabled,
        timezone: formData.timezone.trim() === '' ? undefined : formData.timezone.trim(),
      },
    }
  }

  return {
    formData,
    bindings,
    hasBackupRepositories,
    hasReplicationTargets,
    isDeltaMode: computed(() => formData.mode === 'delta'),
    validate,
    validateAndBuildPayload,
  }
}
