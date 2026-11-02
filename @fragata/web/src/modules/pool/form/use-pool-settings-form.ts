import type { EditPoolPayload } from '@/modules/pool/jobs/xo-pool.jobs.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useXoSrCollection } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { type FormValidationConfig, required } from '@core/packages/form-validation'
import { useValidatedForm } from '@core/packages/validated-form'
import { computed, reactive } from 'vue'
import { useI18n } from 'vue-i18n'

/** `''` stands for "no SR" in the selects */
type SrChoice = string

export type PoolSettingsFormData = {
  nameLabel: string
  nameDescription: string
  autoPoweron: boolean
  migrationCompression: boolean
  defaultSrId: SrChoice
  suspendSrId: SrChoice
  crashDumpSrId: SrChoice
}

function toSrId(choice: SrChoice): string | null {
  return choice === '' ? null : choice
}

export function usePoolSettingsForm(pool: FrontXoPool) {
  const { t } = useI18n()
  const { srsByPool } = useXoSrCollection()

  const formData = reactive<PoolSettingsFormData>({
    nameLabel: pool.name_label,
    nameDescription: pool.name_description,
    autoPoweron: pool.auto_poweron,
    migrationCompression: pool.migrationCompression ?? false,
    defaultSrId: pool.default_SR ?? '',
    suspendSrId: pool.suspendSr ?? '',
    crashDumpSrId: pool.crashDumpSr ?? '',
  })

  const config: FormValidationConfig<PoolSettingsFormData> = {
    errors: {
      onSubmit: () => ({
        nameLabel: { required },
      }),
    },
  }

  const { useField, useFormSelect, useSelect, validate } = useValidatedForm(formData, config)

  // ISO SRs cannot hold VM disks, suspend images or crash dumps
  const srOptions = computed(() => [
    { id: 'none', label: t('none'), value: '' },
    ...(srsByPool.value.get(pool.id) ?? [])
      .filter(sr => sr.SR_type !== 'iso' && sr.content_type !== 'iso')
      .map(sr => ({ id: sr.id, label: sr.name_label, value: sr.id as string })),
  ])

  const selectConfig = { required: true, searchable: true, option: { label: 'label', value: 'value' } } as const

  const { id: defaultSrSelectId } = useFormSelect('defaultSrId', srOptions, selectConfig)
  const { id: suspendSrSelectId } = useFormSelect('suspendSrId', srOptions, selectConfig)
  const { id: crashDumpSrSelectId } = useFormSelect('crashDumpSrId', srOptions, selectConfig)

  const bindings = reactive({
    nameLabel: useField('nameLabel', () => ({ label: t('name'), required: true })),
    nameDescription: useField('nameDescription', () => ({ label: t('description') })),
    autoPoweron: useField('autoPoweron', () => ({ label: t('auto-power-on') })),
    migrationCompression: useField('migrationCompression', () => ({ label: t('migration-compression') })),
    defaultSrId: useSelect(defaultSrSelectId, () => ({ label: t('default-storage-repository') })),
    suspendSrId: useSelect(suspendSrSelectId, () => ({ label: t('suspend-storage-repository') })),
    crashDumpSrId: useSelect(crashDumpSrSelectId, () => ({ label: t('crash-dump-storage-repository') })),
  })

  /** Builds the PATCH body with only the properties that differ from the pool */
  async function validateAndBuildPayload(): Promise<EditPoolPayload | undefined> {
    if (!(await validate())) {
      return undefined
    }

    const payload: EditPoolPayload = {}

    if (formData.nameLabel !== pool.name_label) payload.nameLabel = formData.nameLabel
    if (formData.nameDescription !== pool.name_description) payload.nameDescription = formData.nameDescription
    if (formData.autoPoweron !== pool.auto_poweron) payload.autoPoweron = formData.autoPoweron
    if (formData.migrationCompression !== (pool.migrationCompression ?? false)) {
      payload.migrationCompression = formData.migrationCompression
    }
    if (formData.defaultSrId !== (pool.default_SR ?? '')) payload.defaultSrId = toSrId(formData.defaultSrId)
    if (formData.suspendSrId !== (pool.suspendSr ?? '')) payload.suspendSrId = toSrId(formData.suspendSrId)
    if (formData.crashDumpSrId !== (pool.crashDumpSr ?? '')) payload.crashDumpSrId = toSrId(formData.crashDumpSrId)

    return payload
  }

  return { formData, bindings, validateAndBuildPayload }
}
