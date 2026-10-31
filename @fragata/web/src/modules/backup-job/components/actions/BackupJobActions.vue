<template>
  <UiButton
    v-if="schedules.length <= 1"
    v-tooltip="!canRunBackupJob && (runBackupJobErrorMessage || !hasSchedule ? t('backup-job:no-schedule') : false)"
    accent="brand"
    variant="secondary"
    size="medium"
    left-icon="fa:play"
    :disabled="!canRunBackupJob || !hasSchedule"
    :busy="isRunningBackupJob"
    @click="runBackupJob()"
  >
    {{ t('action:run-now') }}
  </UiButton>
  <MenuList v-else placement="bottom-end">
    <template #trigger="{ open }">
      <UiButton
        accent="brand"
        variant="secondary"
        size="medium"
        left-icon="fa:play"
        :disabled="!canRunBackupJob"
        :busy="isRunningBackupJob"
        @click="open($event)"
      >
        {{ t('action:run-now') }}
      </UiButton>
    </template>
    <MenuItem v-for="schedule of schedules" :key="schedule.id" accent="brand" @click="runBackupJob(schedule)">
      {{ schedule.name || schedule.cron }}
    </MenuItem>
  </MenuList>

  <MenuList placement="bottom-end">
    <template #trigger="{ open }">
      <UiButtonIcon
        v-tooltip="{ placement: 'left', content: t('more-actions') }"
        accent="brand"
        icon="action:more-actions"
        size="medium"
        @click="open($event)"
      />
    </template>
    <MenuItem
      v-tooltip="!canEditBackupJob && editBackupJobErrorMessage"
      accent="brand"
      icon="action:edit"
      :disabled="!canEditBackupJob"
      @click="openEditVmBackupJobDrawer()"
    >
      {{ t('action:edit') }}
    </MenuItem>
    <MenuSeparator />
    <MenuItem
      v-tooltip="!canDeleteBackupJobs && deleteBackupJobsErrorMessage"
      accent="danger"
      icon="action:delete"
      :disabled="!canDeleteBackupJobs"
      :busy="isDeletingBackupJobs"
      @click="deleteBackupJobs()"
    >
      {{ t('action:delete') }}
    </MenuItem>
  </MenuList>
</template>

<script lang="ts" setup>
import { useBackupJobDelete } from '@/modules/backup-job/composables/use-backup-job-delete.composable.ts'
import { useBackupJobRun } from '@/modules/backup-job/composables/use-backup-job-run.composable.ts'
import { useVmBackupJobDrawer } from '@/modules/backup-job/composables/use-vm-backup-job-drawer.composable.ts'
import type { FrontAnyXoBackupJob } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import MenuList from '@core/components/menu/MenuList.vue'
import MenuSeparator from '@core/components/menu/MenuSeparator.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useI18n } from 'vue-i18n'

const { backupJob } = defineProps<{
  backupJob: FrontAnyXoBackupJob
}>()

const { t } = useI18n()

const { schedules, hasSchedule, runBackupJob, canRunBackupJob, isRunningBackupJob, runBackupJobErrorMessage } =
  useBackupJobRun(() => backupJob)

const { openEditVmBackupJobDrawer, canEditBackupJob, editBackupJobErrorMessage } = useVmBackupJobDrawer(
  () => backupJob
)

const { deleteBackupJobs, canDeleteBackupJobs, isDeletingBackupJobs, deleteBackupJobsErrorMessage } =
  useBackupJobDelete(() => [backupJob])
</script>
