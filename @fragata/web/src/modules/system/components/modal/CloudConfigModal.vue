<template>
  <UiModal accent="info" icon="fa:code" @confirm="handleConfirm()" @dismiss="emit('cancel')">
    <template #title>
      {{ cloudConfig === undefined ? t('action:new-cloud-config') : t('action:edit-cloud-config') }}
    </template>

    <template #content>
      <div class="cloud-config-form">
        <VtsInputWrapper :label="t('name')" :message="nameError">
          <UiInput v-model.trim="name" accent="brand" required />
        </VtsInputWrapper>
        <div v-if="cloudConfig === undefined" class="types">
          <UiRadioButton v-model="type" value="user" accent="brand">{{ t('cloud-configs:user-data') }}</UiRadioButton>
          <UiRadioButton v-model="type" value="network" accent="brand">
            {{ t('cloud-configs:network') }}
          </UiRadioButton>
        </div>
        <UiTextarea v-model="template" accent="brand">{{ t('cloud-configs:template') }}</UiTextarea>
        <p class="hint typo-body-regular-small">{{ t('cloud-configs:template-hint') }}</p>
      </div>
    </template>

    <template #buttons>
      <VtsOverlayCancelButton @click="emit('cancel')" />
      <VtsOverlayConfirmButton>{{ t('action:save') }}</VtsOverlayConfirmButton>
    </template>
  </UiModal>
</template>

<script lang="ts" setup>
import type { InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import UiInput from '@core/components/ui/input/UiInput.vue'
import UiModal from '@core/components/ui/modal/UiModal.vue'
import UiRadioButton from '@core/components/ui/radio-button/UiRadioButton.vue'
import UiTextarea from '@core/components/ui/text-area/UiTextarea.vue'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

export type CloudConfig = { id: string; name: string; template: string; type: 'user' | 'network' }
export type CloudConfigPayload = Omit<CloudConfig, 'id'>

const { cloudConfig } = defineProps<{
  cloudConfig?: CloudConfig
}>()

const emit = defineEmits<{
  confirm: [payload: CloudConfigPayload]
  cancel: []
}>()

const { t } = useI18n()

const name = ref(cloudConfig?.name ?? '')
const type = ref<CloudConfig['type']>(cloudConfig?.type ?? 'user')
const template = ref(cloudConfig?.template ?? '#cloud-config\nhostname: {name}\n')
const submitted = ref(false)

const nameError = computed<InputWrapperMessage | undefined>(() =>
  submitted.value && name.value === '' ? { content: t('job:arg:name-required'), accent: 'danger' } : undefined
)

function handleConfirm() {
  submitted.value = true

  if (name.value === '') {
    return
  }

  emit('confirm', { name: name.value, type: type.value, template: template.value })
}
</script>

<style lang="postcss" scoped>
.cloud-config-form {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
  text-align: left;

  .types {
    display: flex;
    gap: 1.6rem;
  }

  .hint {
    color: var(--color-neutral-txt-secondary);
  }

  :deep(textarea) {
    min-height: 20rem;
    font-family: monospace;
  }
}
</style>
