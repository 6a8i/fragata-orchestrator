<template>
  <UiModal accent="info" icon="fa:lock" @confirm="handleConfirm()" @dismiss="emit('cancel')">
    <template #title>
      {{ t('modal:host-certificate-title', { name: host.name_label }) }}
    </template>

    <template #content>
      <div class="host-certificate-form">
        <p>{{ t('modal:host-certificate-description') }}</p>
        <UiTextarea v-model="certificate" accent="brand" required placeholder="-----BEGIN CERTIFICATE-----">
          {{ t('certificate') }}
        </UiTextarea>
        <UiTextarea v-model="privateKey" accent="brand" required placeholder="-----BEGIN PRIVATE KEY-----">
          {{ t('private-key') }}
        </UiTextarea>
        <UiTextarea v-model="chain" accent="brand" placeholder="-----BEGIN CERTIFICATE-----">
          {{ t('certificate-chain') }}
        </UiTextarea>
        <UiInfo v-if="submitted && !isValid" accent="danger">{{ t('job:host-certificate:required') }}</UiInfo>
      </div>
    </template>

    <template #buttons>
      <VtsOverlayCancelButton @click="emit('cancel')" />
      <VtsOverlayConfirmButton>{{ t('action:install') }}</VtsOverlayConfirmButton>
    </template>
  </UiModal>
</template>

<script lang="ts" setup>
import type { HostCertificatePayload } from '@/modules/host/jobs/xo-host-admin.jobs.ts'
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiModal from '@core/components/ui/modal/UiModal.vue'
import UiTextarea from '@core/components/ui/text-area/UiTextarea.vue'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  host: FrontXoHost
}>()

const emit = defineEmits<{
  confirm: [payload: HostCertificatePayload]
  cancel: []
}>()

const { t } = useI18n()

const certificate = ref('')
const privateKey = ref('')
const chain = ref('')
const submitted = ref(false)

const isValid = computed(() => certificate.value.trim() !== '' && privateKey.value.trim() !== '')

function handleConfirm() {
  submitted.value = true

  if (!isValid.value) {
    return
  }

  const payload: HostCertificatePayload = {
    certificate: certificate.value.trim(),
    privateKey: privateKey.value.trim(),
  }

  if (chain.value.trim() !== '') {
    payload.chain = chain.value.trim()
  }

  emit('confirm', payload)
}
</script>

<style lang="postcss" scoped>
.host-certificate-form {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
  text-align: left;
}
</style>
