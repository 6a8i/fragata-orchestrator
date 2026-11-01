<template>
  <UiModal accent="info" icon="object:backup-archive" @confirm="handleConfirm()" @dismiss="emit('cancel')">
    <template #title>
      {{ t('modal:restore-backup-archive-title', { name: backupArchive.vm.name_label }) }}
    </template>

    <template #content>
      <div class="restore-form">
        <UiInfo accent="info" wrap>{{ t('modal:restore-backup-archive-info') }}</UiInfo>

        <VtsInputWrapper :label="t('target-storage-repository')" :message="srError">
          <VtsSelect :id="srSelectId" accent="brand" />
        </VtsInputWrapper>

        <VtsInputWrapper :label="t('vm-name-prefix')">
          <UiInput v-model.trim="vmNamePrefix" accent="brand" :placeholder="t('vm-name-prefix-placeholder')" />
        </VtsInputWrapper>

        <UiCheckbox v-model="generateNewMacAddresses" accent="brand">
          {{ t('generate-new-mac-addresses') }}
        </UiCheckbox>

        <UiCheckbox v-model="startOnRestore" accent="brand">
          {{ t('start-vm-after-restore') }}
        </UiCheckbox>
      </div>
    </template>

    <template #buttons>
      <VtsOverlayCancelButton @click="emit('cancel')" />
      <VtsOverlayConfirmButton>
        {{ t('action:restore') }}
      </VtsOverlayConfirmButton>
    </template>
  </UiModal>
</template>

<script lang="ts" setup>
import type { RestoreBackupArchivePayload } from '@/modules/backup-archive/jobs/xo-backup-archive-restore.job.ts'
import { useXoSrCollection, type FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { isSrWritable } from '@/modules/storage-repository/utils/xo-sr.util.ts'
import type { FrontXoVmBackupArchive } from '@/modules/vm/remote-resources/use-xo-vm-backup-archive-collection.ts'
import type { InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import VtsSelect from '@core/components/select/VtsSelect.vue'
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiInput from '@core/components/ui/input/UiInput.vue'
import UiModal from '@core/components/ui/modal/UiModal.vue'
import { useFormSelect } from '@core/packages/form-select'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  backupArchive: FrontXoVmBackupArchive
}>()

const emit = defineEmits<{
  confirm: [payload: RestoreBackupArchivePayload]
  cancel: []
}>()

const { t } = useI18n()

const { srs } = useXoSrCollection()

const writableSrs = computed(() => srs.value.filter(sr => isSrWritable(sr)))

const srId = ref<FrontXoSr['id']>()
const vmNamePrefix = ref('')
const generateNewMacAddresses = ref(true)
const startOnRestore = ref(false)
const submitted = ref(false)

const { id: srSelectId } = useFormSelect(writableSrs, {
  model: srId,
  required: true,
  searchable: true,
  option: { label: 'name_label', value: 'id' },
})

const srError = computed<InputWrapperMessage | undefined>(() =>
  submitted.value && srId.value === undefined ? { content: t('target-storage-repository-required'), accent: 'danger' } : undefined
)

function handleConfirm() {
  submitted.value = true

  if (srId.value === undefined) {
    return
  }

  emit('confirm', {
    srId: srId.value,
    vmNamePrefix: vmNamePrefix.value === '' ? undefined : vmNamePrefix.value,
    generateNewMacAddresses: generateNewMacAddresses.value,
    startOnRestore: startOnRestore.value,
  })
}
</script>

<style lang="postcss" scoped>
.restore-form {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
  text-align: left;
}
</style>
