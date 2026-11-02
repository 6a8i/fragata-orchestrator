<template>
  <UiDrawer @confirm="handleConfirm()" @dismiss="emit('cancel')">
    <template #title>
      {{ t('action:edit-settings') }}
    </template>

    <template #content>
      <div class="pool-settings-drawer">
        <div class="section">
          <UiTitle>{{ t('general-information') }}</UiTitle>
          <VtsInputWrapper :label="bindings.nameLabel.label" :message="bindings.nameLabel.error">
            <UiInput v-model.trim="formData.nameLabel" accent="brand" required />
          </VtsInputWrapper>
          <VtsInputWrapper :label="bindings.nameDescription.label">
            <UiInput v-model.trim="formData.nameDescription" accent="brand" />
          </VtsInputWrapper>
          <div class="checkboxes">
            <UiCheckbox v-model="formData.autoPoweron" accent="brand">{{ bindings.autoPoweron.label }}</UiCheckbox>
            <UiCheckbox v-model="formData.migrationCompression" accent="brand">
              {{ bindings.migrationCompression.label }}
            </UiCheckbox>
          </div>
        </div>

        <div class="section">
          <UiTitle>{{ t('storage') }}</UiTitle>
          <VtsInputWrapper :label="bindings.defaultSrId.label">
            <VtsSelect :id="bindings.defaultSrId.id" accent="brand" />
          </VtsInputWrapper>
          <VtsInputWrapper :label="bindings.suspendSrId.label">
            <VtsSelect :id="bindings.suspendSrId.id" accent="brand" />
          </VtsInputWrapper>
          <VtsInputWrapper :label="bindings.crashDumpSrId.label">
            <VtsSelect :id="bindings.crashDumpSrId.id" accent="brand" />
          </VtsInputWrapper>
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
import { usePoolSettingsForm } from '@/modules/pool/form/use-pool-settings-form.ts'
import type { EditPoolPayload } from '@/modules/pool/jobs/xo-pool.jobs.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import VtsSelect from '@core/components/select/VtsSelect.vue'
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'
import UiDrawer from '@core/components/ui/drawer/UiDrawer.vue'
import UiInput from '@core/components/ui/input/UiInput.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useI18n } from 'vue-i18n'

const { pool } = defineProps<{
  pool: FrontXoPool
}>()

const emit = defineEmits<{
  confirm: [payload: EditPoolPayload]
  cancel: []
}>()

const { t } = useI18n()

const { formData, bindings, validateAndBuildPayload } = usePoolSettingsForm(pool)

async function handleConfirm() {
  const payload = await validateAndBuildPayload()

  if (payload !== undefined) {
    emit('confirm', payload)
  }
}
</script>

<style lang="postcss" scoped>
.pool-settings-drawer {
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

  .checkboxes {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }
}
</style>
