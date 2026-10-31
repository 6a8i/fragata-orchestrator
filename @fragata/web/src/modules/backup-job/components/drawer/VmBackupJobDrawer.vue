<template>
  <UiDrawer @confirm="handleConfirm()" @dismiss="emit('cancel')">
    <template #title>
      {{ isEditing ? t('action:edit-backup-job') : t('action:new-backup-job') }}
    </template>

    <template #content>
      <div class="vm-backup-job-drawer">
        <UiAlert v-if="isEditing && otherSchedulesCount > 0" accent="info">
          {{ t('backup-job-form:other-schedules-kept', { n: otherSchedulesCount }) }}
        </UiAlert>

        <div class="section">
          <UiTitle>{{ t('general-information') }}</UiTitle>
          <div class="row">
            <VtsInputWrapper :label="bindings.name.label" :message="bindings.name.error">
              <UiInput v-model.trim="formData.name" accent="brand" required @blur="bindings.name.onBlur()" />
            </VtsInputWrapper>
            <VtsInputWrapper :label="bindings.mode.label" :message="bindings.mode.error">
              <VtsSelect :id="bindings.mode.id" accent="brand" />
            </VtsInputWrapper>
          </div>
          <div class="row">
            <VtsInputWrapper :label="bindings.compression.label" :message="bindings.compression.error">
              <VtsSelect :id="bindings.compression.id" accent="brand" />
            </VtsInputWrapper>
            <VtsInputWrapper :label="bindings.reportWhen.label" :message="bindings.reportWhen.error">
              <VtsSelect :id="bindings.reportWhen.id" accent="brand" />
            </VtsInputWrapper>
          </div>
        </div>

        <div class="section">
          <UiTitle>{{ t('backup-job-form:vms-to-back-up') }}</UiTitle>
          <VtsInputWrapper :label="bindings.vms.label" :message="bindings.vms.error">
            <VtsSelect :id="bindings.vms.id" accent="brand" />
          </VtsInputWrapper>
        </div>

        <div class="section">
          <UiTitle>{{ t('backup-job-form:targets') }}</UiTitle>
          <UiAlert accent="info">{{ t('backup-job-form:targets-hint') }}</UiAlert>
          <div class="row">
            <VtsInputWrapper :label="bindings.backupRepositories.label" :message="bindings.backupRepositories.error">
              <VtsSelect :id="bindings.backupRepositories.id" accent="brand" />
            </VtsInputWrapper>
            <VtsInputWrapper
              v-if="hasBackupRepositories"
              :label="bindings.exportRetention.label"
              :message="bindings.exportRetention.error"
            >
              <UiInput v-model="formData.exportRetention" type="number" accent="brand" />
            </VtsInputWrapper>
          </div>
          <div class="row">
            <VtsInputWrapper :label="bindings.srs.label" :message="bindings.srs.error">
              <VtsSelect :id="bindings.srs.id" accent="brand" />
            </VtsInputWrapper>
            <VtsInputWrapper
              v-if="hasReplicationTargets"
              :label="bindings.copyRetention.label"
              :message="bindings.copyRetention.error"
            >
              <UiInput v-model="formData.copyRetention" type="number" accent="brand" />
            </VtsInputWrapper>
          </div>
          <div class="row">
            <VtsInputWrapper :label="bindings.snapshotRetention.label" :message="bindings.snapshotRetention.error">
              <UiInput v-model="formData.snapshotRetention" type="number" accent="brand" />
            </VtsInputWrapper>
            <VtsInputWrapper
              v-if="isDeltaMode"
              :label="bindings.fullInterval.label"
              :message="bindings.fullInterval.error"
            >
              <UiInput v-model="formData.fullInterval" type="number" accent="brand" />
            </VtsInputWrapper>
          </div>
        </div>

        <div class="section">
          <UiTitle>{{ t('schedule') }}</UiTitle>
          <div class="row">
            <VtsInputWrapper :label="bindings.scheduleName.label" :message="bindings.scheduleName.error">
              <UiInput v-model.trim="formData.scheduleName" accent="brand" />
            </VtsInputWrapper>
            <VtsInputWrapper :label="bindings.cron.label" :message="bindings.cron.error">
              <UiInput v-model.trim="formData.cron" accent="brand" required @blur="bindings.cron.onBlur()" />
            </VtsInputWrapper>
          </div>
          <div class="row">
            <VtsInputWrapper :label="bindings.timezone.label" :message="bindings.timezone.error">
              <UiInput v-model.trim="formData.timezone" accent="brand" />
            </VtsInputWrapper>
            <UiCheckbox v-model="formData.scheduleEnabled" accent="brand" class="checkbox">
              {{ bindings.scheduleEnabled.label }}
            </UiCheckbox>
          </div>
        </div>
      </div>
    </template>

    <template #buttons>
      <VtsOverlayCancelButton @click="emit('cancel')" />
      <VtsOverlayConfirmButton>
        {{ isEditing ? t('action:save') : t('action:create') }}
      </VtsOverlayConfirmButton>
    </template>
  </UiDrawer>
</template>

<script lang="ts" setup>
import { useVmBackupJobForm, type VmBackupJobPayload } from '@/modules/backup-job/form/use-vm-backup-job-form.ts'
import type { FrontXoVmBackupJob } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import type { FrontXoSchedule } from '@/modules/schedule/remote-resources/use-xo-schedule-collection.ts'
import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import VtsSelect from '@core/components/select/VtsSelect.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'
import UiDrawer from '@core/components/ui/drawer/UiDrawer.vue'
import UiInput from '@core/components/ui/input/UiInput.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { backupJob, schedule, otherSchedulesCount = 0 } = defineProps<{
  // when set, the drawer edits this job (and `schedule`, its first schedule) instead of creating one
  backupJob?: FrontXoVmBackupJob
  schedule?: FrontXoSchedule
  otherSchedulesCount?: number
}>()

const emit = defineEmits<{
  confirm: [payload: VmBackupJobPayload]
  cancel: []
}>()

const { t } = useI18n()

const isEditing = computed(() => backupJob !== undefined)

const { formData, bindings, hasBackupRepositories, hasReplicationTargets, isDeltaMode, validateAndBuildPayload } =
  useVmBackupJobForm(backupJob !== undefined ? { backupJob, schedule } : undefined)

async function handleConfirm() {
  const payload = await validateAndBuildPayload()

  if (payload !== undefined) {
    emit('confirm', payload)
  }
}
</script>

<style lang="postcss" scoped>
.vm-backup-job-drawer {
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

  .checkbox {
    padding-block-end: 0.8rem;
  }
}
</style>
