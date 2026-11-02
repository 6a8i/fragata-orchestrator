<template>
  <UiModal accent="warning" icon="status:warning-picto" @confirm="handleConfirm()" @dismiss="emit('cancel')">
    <template #title>
      {{ t('modal:pif-vlan-title', { device: pif.device }) }}
    </template>

    <template #content>
      <div class="pif-vlan-form">
        <p>{{ t('modal:pif-vlan-description') }}</p>
        <VtsInputWrapper :label="t('vlan')" :message="error">
          <UiInput v-model="vlan" type="number" accent="brand" required />
        </VtsInputWrapper>
      </div>
    </template>

    <template #buttons>
      <VtsOverlayCancelButton @click="emit('cancel')" />
      <VtsOverlayConfirmButton>{{ t('action:apply') }}</VtsOverlayConfirmButton>
    </template>
  </UiModal>
</template>

<script lang="ts" setup>
import type { FrontXoPif } from '@/modules/pif/remote-resources/use-xo-pif-collection.ts'
import type { InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import UiInput from '@core/components/ui/input/UiInput.vue'
import UiModal from '@core/components/ui/modal/UiModal.vue'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { pif } = defineProps<{
  pif: FrontXoPif
}>()

const emit = defineEmits<{
  confirm: [vlan: number]
  cancel: []
}>()

const { t } = useI18n()

const vlan = ref<number | ''>(pif.vlan)
const submitted = ref(false)

const isValid = computed(() => {
  const value = Number(vlan.value)
  return vlan.value !== '' && Number.isInteger(value) && value >= 0 && value <= 4094
})

const error = computed<InputWrapperMessage | undefined>(() =>
  submitted.value && !isValid.value ? { content: t('job:pif-vlan:invalid'), accent: 'danger' } : undefined
)

function handleConfirm() {
  submitted.value = true

  if (isValid.value) {
    emit('confirm', Number(vlan.value))
  }
}
</script>

<style lang="postcss" scoped>
.pif-vlan-form {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
  text-align: left;
}
</style>
