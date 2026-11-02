<template>
  <UiModal accent="info" icon="fa:network-wired" @confirm="handleConfirm()" @dismiss="emit('cancel')">
    <template #title>
      {{ t('modal:pif-ip-title', { device: pif.device }) }}
    </template>

    <template #content>
      <div class="pif-ip-form">
        <UiAlert v-if="pif.management" accent="warning">{{ t('modal:pif-ip-management-warning') }}</UiAlert>
        <VtsInputWrapper :label="t('ip-configuration-mode')">
          <VtsSelect :id="modeSelectId" accent="brand" />
        </VtsInputWrapper>
        <template v-if="formData.mode === 'Static'">
          <VtsInputWrapper :label="t('ip-address')" :message="staticError">
            <UiInput v-model.trim="formData.ip" accent="brand" required placeholder="192.168.1.10" />
          </VtsInputWrapper>
          <VtsInputWrapper :label="t('netmask')">
            <UiInput v-model.trim="formData.netmask" accent="brand" required placeholder="255.255.255.0" />
          </VtsInputWrapper>
          <VtsInputWrapper :label="t('gateway')">
            <UiInput v-model.trim="formData.gateway" accent="brand" />
          </VtsInputWrapper>
          <VtsInputWrapper :label="t('dns')" :message="{ content: t('pif-ip:dns-hint'), accent: 'info' }">
            <UiInput v-model.trim="formData.dns" accent="brand" />
          </VtsInputWrapper>
        </template>
      </div>
    </template>

    <template #buttons>
      <VtsOverlayCancelButton @click="emit('cancel')" />
      <VtsOverlayConfirmButton>{{ t('action:apply') }}</VtsOverlayConfirmButton>
    </template>
  </UiModal>
</template>

<script lang="ts" setup>
import type { PifIpPayload } from '@/modules/pif/jobs/xo-pif-admin.jobs.ts'
import type { FrontXoPif } from '@/modules/pif/remote-resources/use-xo-pif-collection.ts'
import type { InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import VtsSelect from '@core/components/select/VtsSelect.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiInput from '@core/components/ui/input/UiInput.vue'
import UiModal from '@core/components/ui/modal/UiModal.vue'
import { useFormSelect } from '@core/packages/form-select'
import { computed, reactive, ref, toRef } from 'vue'
import { useI18n } from 'vue-i18n'

const { pif } = defineProps<{
  pif: FrontXoPif
}>()

const emit = defineEmits<{
  confirm: [payload: PifIpPayload]
  cancel: []
}>()

const { t } = useI18n()

type Mode = PifIpPayload['mode']

const formData = reactive({
  mode: (['None', 'DHCP', 'Static'].includes(pif.mode) ? pif.mode : 'None') as Mode,
  ip: pif.ip,
  netmask: pif.netmask,
  gateway: pif.gateway,
  dns: pif.dns,
})

const modeOptions = computed(() => [
  { id: 'None' as const, label: t('none') },
  { id: 'DHCP' as const, label: t('dhcp') },
  { id: 'Static' as const, label: t('static') },
])

const { id: modeSelectId } = useFormSelect(modeOptions, {
  model: toRef(formData, 'mode'),
  required: true,
  option: { value: 'id' },
})

const submitted = ref(false)

const isValid = computed(() => formData.mode !== 'Static' || (formData.ip !== '' && formData.netmask !== ''))

const staticError = computed<InputWrapperMessage | undefined>(() =>
  submitted.value && !isValid.value ? { content: t('job:pif-ip:static-needs-ip'), accent: 'danger' } : undefined
)

function handleConfirm() {
  submitted.value = true

  if (!isValid.value) {
    return
  }

  emit(
    'confirm',
    formData.mode === 'Static'
      ? { mode: 'Static', ip: formData.ip, netmask: formData.netmask, gateway: formData.gateway, dns: formData.dns }
      : { mode: formData.mode }
  )
}
</script>

<style lang="postcss" scoped>
.pif-ip-form {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
  text-align: left;
}
</style>
