<template>
  <UiModal accent="info" icon="fa:floppy-disk" @confirm="handleConfirm()" @dismiss="emit('cancel')">
    <template #title>{{ title }}</template>

    <template #content>
      <div class="other-backup-job-form">
        <p class="description">
          {{ kind === 'metadata' ? t('metadata-backup:description') : t('mirror-backup:description') }}
        </p>
        <VtsInputWrapper :label="t('name')" :message="errorFor('name')">
          <UiInput v-model.trim="form.name" accent="brand" required />
        </VtsInputWrapper>

        <template v-if="kind === 'mirror'">
          <div class="modes">
            <UiRadioButton v-model="form.mode" value="full" accent="brand">{{ t('backup-mode:full') }}</UiRadioButton>
            <UiRadioButton v-model="form.mode" value="delta" accent="brand">{{ t('backup-mode:delta') }}</UiRadioButton>
          </div>
          <VtsInputWrapper :label="t('mirror-backup:source')" :message="errorFor('source')">
            <VtsSelect :id="sourceSelectId" accent="brand" />
          </VtsInputWrapper>
        </template>

        <VtsInputWrapper
          :label="kind === 'mirror' ? t('mirror-backup:targets') : t('backup-repositories')"
          :message="errorFor('remotes')"
        >
          <VtsSelect :id="remotesSelectId" accent="brand" />
        </VtsInputWrapper>

        <template v-if="kind === 'metadata'">
          <UiCheckbox v-model="form.xoMetadata" accent="brand">{{ t('metadata-backup:xo-config') }}</UiCheckbox>
          <VtsInputWrapper :label="t('metadata-backup:pools')" :message="errorFor('content')">
            <VtsSelect :id="poolsSelectId" accent="brand" />
          </VtsInputWrapper>
        </template>

        <div class="row">
          <VtsInputWrapper v-if="backupJob === undefined" :label="t('schedule')" :message="t('cron-info')">
            <UiInput v-model.trim="form.cron" accent="brand" />
          </VtsInputWrapper>
          <VtsInputWrapper :label="t('retention')">
            <UiInput v-model="form.retention" type="number" accent="brand" />
          </VtsInputWrapper>
        </div>
      </div>
    </template>

    <template #buttons>
      <VtsOverlayCancelButton @click="emit('cancel')" />
      <VtsOverlayConfirmButton>{{ t('action:save') }}</VtsOverlayConfirmButton>
    </template>
  </UiModal>
</template>

<script lang="ts" setup>
import type {
  FrontXoMetadataBackupJob,
  FrontXoMirrorBackupJob,
} from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import {
  idsOfPattern,
  type OtherBackupJobForm,
  type OtherBackupJobKind,
  retentionOf,
} from '@/modules/backup-job/utils/other-backup-job.util.ts'
import { useXoBackupRepositoryCollection } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import { useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import type { InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import VtsSelect from '@core/components/select/VtsSelect.vue'
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'
import UiInput from '@core/components/ui/input/UiInput.vue'
import UiModal from '@core/components/ui/modal/UiModal.vue'
import UiRadioButton from '@core/components/ui/radio-button/UiRadioButton.vue'
import { useFormSelect } from '@core/packages/form-select'
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { kind, backupJob } = defineProps<{
  kind: OtherBackupJobKind
  backupJob?: FrontXoMetadataBackupJob | FrontXoMirrorBackupJob
}>()

const emit = defineEmits<{
  confirm: [form: OtherBackupJobForm]
  cancel: []
}>()

const { t } = useI18n()

const { backupRepositories } = useXoBackupRepositoryCollection()
const { pools } = useXoPoolCollection()

const metadataJob = kind === 'metadata' ? (backupJob as FrontXoMetadataBackupJob | undefined) : undefined
const mirrorJob = kind === 'mirror' ? (backupJob as FrontXoMirrorBackupJob | undefined) : undefined

const form = reactive<OtherBackupJobForm>({
  name: backupJob?.name ?? '',
  remoteIds: idsOfPattern(backupJob?.remotes),
  retention: retentionOf(kind, backupJob?.settings as Record<string, Record<string, unknown>> | undefined),
  cron: '0 1 * * *',
  poolIds: idsOfPattern(metadataJob?.pools),
  xoMetadata: metadataJob?.xoMetadata ?? kind === 'metadata',
  mode: mirrorJob?.mode ?? 'delta',
  sourceRemoteId: mirrorJob?.sourceRemote,
})
const submitted = ref(false)

const title = computed(() => {
  if (kind === 'metadata') {
    return backupJob === undefined ? t('action:new-metadata-backup') : t('action:edit-metadata-backup')
  }
  return backupJob === undefined ? t('action:new-mirror-backup') : t('action:edit-mirror-backup')
})

const remoteOption = {
  id: (br: { id: string }) => br.id,
  value: (br: { id: string }) => br.id as string,
  label: (br: { name: string }) => br.name,
}

const { id: remotesSelectId } = useFormSelect(
  computed(() => backupRepositories.value.filter(br => br.id !== form.sourceRemoteId)),
  {
    model: computed({ get: () => form.remoteIds, set: ids => (form.remoteIds = ids) }),
    multiple: true,
    option: remoteOption,
  }
)

const { id: sourceSelectId } = useFormSelect(backupRepositories, {
  model: computed({ get: () => form.sourceRemoteId, set: id => (form.sourceRemoteId = id) }),
  required: true,
  option: remoteOption,
})

const { id: poolsSelectId } = useFormSelect(pools, {
  model: computed({ get: () => form.poolIds, set: ids => (form.poolIds = ids) }),
  multiple: true,
  searchable: true,
  option: { id: pool => pool.id, value: pool => pool.id as string, label: pool => pool.name_label },
})

type Field = 'name' | 'remotes' | 'source' | 'content'

const missing = computed(() => {
  const fields = new Set<Field>()
  if (form.name === '') fields.add('name')
  if (form.remoteIds.length === 0) fields.add('remotes')
  if (kind === 'mirror' && form.sourceRemoteId === undefined) fields.add('source')
  if (kind === 'metadata' && !form.xoMetadata && form.poolIds.length === 0) fields.add('content')
  return fields
})

function errorFor(field: Field): InputWrapperMessage | undefined {
  if (!submitted.value || !missing.value.has(field)) {
    return undefined
  }
  return { content: field === 'content' ? t('metadata-backup:nothing-to-save') : t('field-required'), accent: 'danger' }
}

function handleConfirm() {
  submitted.value = true
  if (missing.value.size === 0) {
    emit('confirm', { ...form, retention: Number(form.retention) })
  }
}
</script>

<style lang="postcss" scoped>
.other-backup-job-form {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
  text-align: left;

  .description {
    color: var(--color-neutral-txt-secondary);
  }

  .modes,
  .row {
    display: flex;
    gap: 1.6rem;
  }
}
</style>
