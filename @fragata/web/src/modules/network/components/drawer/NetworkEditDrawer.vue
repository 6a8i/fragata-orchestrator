<template>
  <UiDrawer @confirm="handleConfirm()" @dismiss="emit('cancel')">
    <template #title>
      {{ t('action:edit-network') }}
    </template>

    <template #content>
      <div class="network-edit-drawer">
        <VtsInputWrapper :label="t('name')" :message="nameError">
          <UiInput v-model.trim="formData.nameLabel" accent="brand" required />
        </VtsInputWrapper>
        <VtsInputWrapper :label="t('description')">
          <UiInput v-model.trim="formData.nameDescription" accent="brand" />
        </VtsInputWrapper>
        <VtsInputWrapper :label="t('mtu')" :message="mtuError">
          <UiInput v-model="formData.mtu" type="number" accent="brand" />
        </VtsInputWrapper>
        <VtsInputWrapper :label="t('network-block-device')" :message="nbdMessage">
          <VtsSelect :id="nbdSelectId" accent="brand" />
        </VtsInputWrapper>
        <div class="checkboxes">
          <UiCheckbox v-model="formData.automatic" accent="brand">{{ t('network:automatic') }}</UiCheckbox>
          <UiCheckbox v-model="formData.defaultIsLocked" accent="brand">{{ t('network:default-locked') }}</UiCheckbox>
        </div>
      </div>
    </template>

    <template #buttons>
      <VtsOverlayCancelButton @click="emit('cancel')" />
      <VtsOverlayConfirmButton>{{ t('action:save') }}</VtsOverlayConfirmButton>
    </template>
  </UiDrawer>
</template>

<script lang="ts" setup>
import type { EditNetworkPayload } from '@/modules/network/jobs/xo-network-edit.job.ts'
import type { FrontXoNetwork } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import type { InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import VtsSelect from '@core/components/select/VtsSelect.vue'
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'
import UiDrawer from '@core/components/ui/drawer/UiDrawer.vue'
import UiInput from '@core/components/ui/input/UiInput.vue'
import { useFormSelect } from '@core/packages/form-select'
import { computed, reactive, ref, toRef } from 'vue'
import { useI18n } from 'vue-i18n'

const { network } = defineProps<{
  network: FrontXoNetwork
}>()

const emit = defineEmits<{
  confirm: [payload: EditNetworkPayload]
  cancel: []
}>()

const { t } = useI18n()

type NbdMode = 'disabled' | 'secure' | 'insecure'

const initialNbd: NbdMode = network.insecureNbd ? 'insecure' : network.nbd ? 'secure' : 'disabled'

const formData = reactive({
  nameLabel: network.name_label,
  nameDescription: network.name_description,
  mtu: network.MTU as number | '',
  automatic: network.automatic,
  defaultIsLocked: network.defaultIsLocked,
  nbd: initialNbd as NbdMode,
})

const nbdOptions = computed(() => [
  { id: 'disabled' as const, label: t('nbd:disabled') },
  { id: 'secure' as const, label: t('nbd:secure') },
  { id: 'insecure' as const, label: t('nbd:insecure') },
])

const { id: nbdSelectId } = useFormSelect(nbdOptions, {
  model: toRef(formData, 'nbd'),
  required: true,
  option: { value: option => option.id },
})

const submitted = ref(false)

const nameError = computed<InputWrapperMessage | undefined>(() =>
  submitted.value && formData.nameLabel === '' ? { content: t('job:arg:name-required'), accent: 'danger' } : undefined
)

const isMtuValid = computed(() => {
  const mtu = Number(formData.mtu)
  return Number.isInteger(mtu) && mtu >= 68 && mtu <= 9216
})

const mtuError = computed<InputWrapperMessage | undefined>(() =>
  submitted.value && !isMtuValid.value ? { content: t('network:mtu-invalid'), accent: 'danger' } : undefined
)

const nbdMessage = computed<InputWrapperMessage | undefined>(() =>
  formData.nbd === 'insecure' ? { content: t('nbd:insecure-warning'), accent: 'warning' } : undefined
)

function handleConfirm() {
  submitted.value = true

  if (formData.nameLabel === '' || !isMtuValid.value) {
    return
  }

  const payload: EditNetworkPayload = {}

  if (formData.nameLabel !== network.name_label) payload.nameLabel = formData.nameLabel
  if (formData.nameDescription !== network.name_description) payload.nameDescription = formData.nameDescription
  if (Number(formData.mtu) !== network.MTU) payload.mtu = Number(formData.mtu)
  if (formData.automatic !== network.automatic) payload.automatic = formData.automatic
  if (formData.defaultIsLocked !== network.defaultIsLocked) payload.defaultIsLocked = formData.defaultIsLocked
  if (formData.nbd !== initialNbd) {
    payload.nbd = formData.nbd === 'secure'
    payload.insecureNbd = formData.nbd === 'insecure'
  }

  emit('confirm', payload)
}
</script>

<style lang="postcss" scoped>
.network-edit-drawer {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
  margin-block-start: 1.6rem;
  text-align: left;

  .checkboxes {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }
}
</style>
