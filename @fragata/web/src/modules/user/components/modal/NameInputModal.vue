<template>
  <UiModal accent="info" icon="action:edit" @confirm="handleConfirm()" @dismiss="emit('cancel')">
    <template #title>{{ title }}</template>

    <template #content>
      <div class="name-input-modal">
        <VtsInputWrapper :label="label" :message="error">
          <UiInput v-model.trim="name" accent="brand" required />
        </VtsInputWrapper>
      </div>
    </template>

    <template #buttons>
      <VtsOverlayCancelButton @click="emit('cancel')" />
      <VtsOverlayConfirmButton>{{ confirmLabel }}</VtsOverlayConfirmButton>
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
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { initialValue = '' } = defineProps<{
  title: string
  label: string
  confirmLabel: string
  initialValue?: string
}>()

const emit = defineEmits<{
  confirm: [name: string]
  cancel: []
}>()

const { t } = useI18n()

const name = ref(initialValue)
const submitted = ref(false)

const error = computed<InputWrapperMessage | undefined>(() =>
  submitted.value && name.value === '' ? { content: t('field-required'), accent: 'danger' } : undefined
)

function handleConfirm() {
  submitted.value = true
  if (name.value !== '') {
    emit('confirm', name.value)
  }
}
</script>

<style lang="postcss" scoped>
.name-input-modal {
  text-align: left;
}
</style>
