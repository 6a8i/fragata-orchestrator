<template>
  <UiCard>
    <UiTitle>{{ t('import:file') }}</UiTitle>
    <p class="description">{{ t('import:file-description') }}</p>
    <UiAlert v-if="message !== undefined" :accent="message.accent">{{ message.content }}</UiAlert>

    <input class="file-input" type="file" accept=".xva,.vhd,.iso,.img,.raw" @change="onFileChange($event)" />
    <UiInfo v-if="file !== undefined && kind === undefined" accent="danger">{{ t('import:unsupported-file') }}</UiInfo>

    <VtsInputWrapper :label="t('storage-repository')">
      <VtsSelect :id="srSelectId" accent="brand" />
    </VtsInputWrapper>
    <VtsInputWrapper v-if="kind !== 'vm'" :label="t('name')">
      <UiInput v-model.trim="name" accent="brand" />
    </VtsInputWrapper>
    <div>
      <UiButton
        accent="brand"
        variant="primary"
        size="medium"
        left-icon="fa:file"
        :disabled="!canImport"
        :busy="isImporting"
        @click="importFile()"
      >
        {{ kind === 'vm' ? t('action:import-vm') : t('action:import-disk') }}
      </UiButton>
    </div>
  </UiCard>
</template>

<script setup lang="ts">
import { baseName, diskFormatFromName, uploadFile } from '@/modules/import/utils/import.util.ts'
import { useXoSrCollection } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { toErrorMessage } from '@/modules/system/utils/system.util.ts'
import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsSelect from '@core/components/select/VtsSelect.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiInput from '@core/components/ui/input/UiInput.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useFormSelect } from '@core/packages/form-select'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const { srs } = useXoSrCollection()

const file = ref<File>()
const srId = ref<string>()
const name = ref('')
const isImporting = ref(false)
const message = ref<{ accent: 'success' | 'danger'; content: string }>()

/** an XVA is a VM, imported into the pool of the SR; the other files are disks */
const kind = computed(() => {
  if (file.value === undefined) {
    return undefined
  }
  if (file.value.name.toLowerCase().endsWith('.xva')) {
    return 'vm'
  }
  return diskFormatFromName(file.value.name) === undefined ? undefined : 'disk'
})

const { id: srSelectId } = useFormSelect(
  computed(() => srs.value.filter(sr => sr.content_type !== 'iso' || kind.value === 'disk')),
  { model: srId, required: true, searchable: true, option: { label: 'name_label', value: sr => sr.id as string } }
)

const canImport = computed(() => kind.value !== undefined && srId.value !== undefined)

function onFileChange(event: Event) {
  file.value = (event.target as HTMLInputElement).files?.[0]
  name.value = file.value === undefined ? '' : baseName(file.value.name)
  message.value = undefined
}

async function importFile() {
  const sr = srs.value.find(candidate => candidate.id === srId.value)
  if (file.value === undefined || sr === undefined) {
    return
  }
  isImporting.value = true
  message.value = undefined
  try {
    if (kind.value === 'vm') {
      await uploadFile(`pools/${sr.$pool}/vms?sr=${sr.id}`, file.value)
    } else {
      const query = new URLSearchParams({ name_label: name.value || baseName(file.value.name) })
      if (diskFormatFromName(file.value.name) === 'raw') {
        query.set('raw', 'true')
      }
      await uploadFile(`srs/${sr.id}/vdis?${query}`, file.value)
    }
    message.value = { accent: 'success', content: t('import:file-done', { name: file.value.name }) }
  } catch (error) {
    message.value = { accent: 'danger', content: toErrorMessage(error) }
  } finally {
    isImporting.value = false
  }
}
</script>

<style scoped lang="postcss">
.description {
  color: var(--color-neutral-txt-secondary);
}
</style>
