<template>
  <UiDrawer @confirm="handleConfirm()" @dismiss="emit('cancel')">
    <template #title>
      {{ t('action:edit-settings') }}
    </template>

    <template #content>
      <div class="vm-settings-drawer">
        <UiAlert v-if="vm.power_state !== 'Halted'" accent="info">
          {{ t('vm-settings:some-changes-need-halted-vm') }}
        </UiAlert>

        <div class="section">
          <UiTitle>{{ t('general-information') }}</UiTitle>
          <div class="row">
            <VtsInputWrapper :label="bindings.nameLabel.label" :message="bindings.nameLabel.error">
              <UiInput v-model.trim="formData.nameLabel" accent="brand" required />
            </VtsInputWrapper>
            <VtsInputWrapper :label="bindings.nameDescription.label">
              <UiInput v-model.trim="formData.nameDescription" accent="brand" />
            </VtsInputWrapper>
          </div>
          <div class="row">
            <VtsInputWrapper :label="bindings.highAvailability.label" :message="bindings.highAvailability.error">
              <VtsSelect :id="bindings.highAvailability.id" accent="brand" />
            </VtsInputWrapper>
            <VtsInputWrapper :label="bindings.startDelay.label" :message="bindings.startDelay.error">
              <UiInput v-model="formData.startDelay" type="number" accent="brand" />
            </VtsInputWrapper>
          </div>
          <UiCheckbox v-model="formData.autoPoweron" accent="brand">{{ bindings.autoPoweron.label }}</UiCheckbox>
        </div>

        <div class="section">
          <UiTitle>{{ t('resource-management') }}</UiTitle>
          <div class="row">
            <VtsInputWrapper :label="bindings.cpus.label" :message="bindings.cpus.error">
              <UiInput v-model="formData.cpus" type="number" accent="brand" />
            </VtsInputWrapper>
            <VtsInputWrapper :label="bindings.cpusMax.label" :message="bindings.cpusMax.error">
              <UiInput v-model="formData.cpusMax" type="number" accent="brand" />
            </VtsInputWrapper>
          </div>
          <div class="row">
            <VtsInputWrapper :label="bindings.coresPerSocket.label">
              <UiInput v-model="formData.coresPerSocket" type="number" accent="brand" />
            </VtsInputWrapper>
            <VtsInputWrapper :label="bindings.cpuWeight.label">
              <UiInput v-model="formData.cpuWeight" type="number" accent="brand" />
            </VtsInputWrapper>
          </div>
          <div class="row">
            <VtsInputWrapper :label="bindings.cpuCap.label">
              <UiInput v-model="formData.cpuCap" type="number" accent="brand" />
            </VtsInputWrapper>
            <VtsInputWrapper :label="bindings.memoryStaticMaxMib.label" :message="bindings.memoryStaticMaxMib.error">
              <UiInput v-model="formData.memoryStaticMaxMib" type="number" accent="brand" />
            </VtsInputWrapper>
          </div>
          <div class="row">
            <VtsInputWrapper :label="bindings.memoryMinMib.label" :message="bindings.memoryMinMib.error">
              <UiInput v-model="formData.memoryMinMib" type="number" accent="brand" />
            </VtsInputWrapper>
            <VtsInputWrapper :label="bindings.memoryMaxMib.label" :message="bindings.memoryMaxMib.error">
              <UiInput v-model="formData.memoryMaxMib" type="number" accent="brand" />
            </VtsInputWrapper>
          </div>
        </div>

        <div class="section">
          <UiTitle>{{ t('virtualization-boot-settings') }}</UiTitle>
          <div class="row">
            <VtsInputWrapper :label="bindings.bootFirmware.label" :message="bindings.bootFirmware.error">
              <VtsSelect :id="bindings.bootFirmware.id" accent="brand" />
            </VtsInputWrapper>
            <VtsInputWrapper
              :label="bindings.bootOrder.label"
              :message="bindings.bootOrder.error ?? bindings.bootOrder.info"
            >
              <UiInput v-model.trim="formData.bootOrder" accent="brand" :disabled="!isHvm" placeholder="cdn" />
            </VtsInputWrapper>
          </div>
          <div class="checkboxes">
            <UiCheckbox v-model="formData.secureBoot" accent="brand">{{ bindings.secureBoot.label }}</UiCheckbox>
            <UiCheckbox v-model="formData.viridian" accent="brand">{{ bindings.viridian.label }}</UiCheckbox>
            <UiCheckbox v-model="formData.hasVendorDevice" accent="brand">
              {{ bindings.hasVendorDevice.label }}
            </UiCheckbox>
            <UiCheckbox v-model="formData.nestedVirt" accent="brand">{{ bindings.nestedVirt.label }}</UiCheckbox>
          </div>
        </div>

        <div class="section">
          <UiTitle>{{ t('graphics') }}</UiTitle>
          <div class="row">
            <VtsInputWrapper :label="bindings.vga.label" :message="bindings.vga.error">
              <VtsSelect :id="bindings.vga.id" accent="brand" />
            </VtsInputWrapper>
            <VtsInputWrapper :label="bindings.videoram.label" :message="bindings.videoram.error">
              <VtsSelect :id="bindings.videoram.id" accent="brand" />
            </VtsInputWrapper>
          </div>
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
import { useVmSettingsForm } from '@/modules/vm/form/use-vm-settings-form.ts'
import type { EditVmPayload } from '@/modules/vm/jobs/xo-vm-edit.job.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import VtsSelect from '@core/components/select/VtsSelect.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'
import UiDrawer from '@core/components/ui/drawer/UiDrawer.vue'
import UiInput from '@core/components/ui/input/UiInput.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: FrontXoVm
}>()

const emit = defineEmits<{
  confirm: [payload: EditVmPayload]
  cancel: []
}>()

const { t } = useI18n()

const { formData, bindings, isHvm, validateAndBuildPayload } = useVmSettingsForm(vm)

async function handleConfirm() {
  const payload = await validateAndBuildPayload()

  if (payload !== undefined) {
    emit('confirm', payload)
  }
}
</script>

<style lang="postcss" scoped>
.vm-settings-drawer {
  display: flex;
  flex-direction: column;
  gap: 3.2rem;
  margin-block-start: 1.6rem;
  text-align: left;

  .section {
    display: flex;
    flex-direction: column;
    gap: 1.6rem;
  }

  .row {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 2.4rem;
    align-items: end;

    & > * {
      width: auto;
    }
  }

  .checkboxes {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }
}
</style>
