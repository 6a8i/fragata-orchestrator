<template>
  <UiCard>
    <UiTitle>{{ t('config:backup') }}</UiTitle>
    <p class="description">{{ t('config:backup-description') }}</p>
    <UiAlert v-if="message !== undefined" :accent="message.accent">{{ message.content }}</UiAlert>

    <UiCardSubtitle>{{ t('action:export') }}</UiCardSubtitle>
    <VtsInputWrapper :label="t('config:passphrase')" :message="t('config:passphrase-export-info')">
      <UiInput v-model="exportPassphrase" type="password" accent="brand" />
    </VtsInputWrapper>
    <div>
      <UiButton
        accent="brand"
        variant="primary"
        size="medium"
        left-icon="fa:download"
        :busy="isExporting"
        @click="exportConfig()"
      >
        {{ t('action:download-config') }}
      </UiButton>
    </div>

    <UiCardSubtitle>{{ t('action:import') }}</UiCardSubtitle>
    <input class="file-input" type="file" @change="onFileChange($event)" />
    <VtsInputWrapper :label="t('config:passphrase')" :message="t('config:passphrase-import-info')">
      <UiInput v-model="importPassphrase" type="password" accent="brand" />
    </VtsInputWrapper>
    <div>
      <UiButton
        accent="danger"
        variant="secondary"
        size="medium"
        left-icon="fa:file"
        :disabled="file === undefined"
        :busy="isImporting"
        @click="confirmImport()"
      >
        {{ t('action:import-config') }}
      </UiButton>
    </div>
  </UiCard>
</template>

<script setup lang="ts">
import { filenameFromDisposition, toErrorMessage } from '@/modules/system/utils/system.util.ts'
import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardSubtitle from '@core/components/ui/card-subtitle/UiCardSubtitle.vue'
import UiInput from '@core/components/ui/input/UiInput.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useTypeToConfirmModal } from '@core/composables/modals/use-type-to-confirm-modal.ts'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const exportPassphrase = ref('')
const importPassphrase = ref('')
const file = ref<File>()
const isExporting = ref(false)
const isImporting = ref(false)
const message = ref<{ accent: 'success' | 'danger'; content: string }>()

function onFileChange(event: Event) {
  file.value = (event.target as HTMLInputElement).files?.[0]
}

async function responseError(response: Response) {
  const body = await response.json().catch(() => undefined)
  return typeof body?.error === 'string' ? body.error : response.statusText
}

async function exportConfig() {
  isExporting.value = true
  message.value = undefined
  try {
    const response = await fetch(`${BASE_URL}/config/actions/export`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(exportPassphrase.value === '' ? {} : { passphrase: exportPassphrase.value }),
    })
    if (!response.ok) {
      throw new Error(await responseError(response))
    }

    const url = URL.createObjectURL(await response.blob())
    const link = document.createElement('a')
    link.href = url
    link.download = filenameFromDisposition(response.headers.get('content-disposition'), 'fragata-config.json.gz')
    link.click()
    URL.revokeObjectURL(url)
  } catch (error) {
    message.value = { accent: 'danger', content: toErrorMessage(error) }
  } finally {
    isExporting.value = false
  }
}

async function importConfig() {
  if (file.value === undefined) {
    return
  }
  isImporting.value = true
  message.value = undefined
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/octet-stream' }
    if (importPassphrase.value !== '') {
      headers['x-config-passphrase'] = importPassphrase.value
    }
    const response = await fetch(`${BASE_URL}/config/actions/import`, {
      method: 'POST',
      credentials: 'same-origin',
      headers,
      body: file.value,
    })
    if (!response.ok) {
      throw new Error(await responseError(response))
    }
    message.value = { accent: 'success', content: t('config:import-done') }
  } catch (error) {
    message.value = { accent: 'danger', content: toErrorMessage(error) }
  } finally {
    isImporting.value = false
  }
}

const { open: openTypeToConfirmModal } = useTypeToConfirmModal()

function confirmImport() {
  return openTypeToConfirmModal({
    props: {
      accent: 'danger',
      icon: 'status:warning-picto',
      title: t('modal:import-config-title'),
      description: t('modal:import-config-description'),
      confirmationText: 'import',
      confirmLabel: t('action:import-config'),
    },
    events: { onConfirm: () => importConfig() },
  })
}
</script>

<style scoped lang="postcss">
.description {
  color: var(--color-neutral-txt-secondary);
}
</style>
