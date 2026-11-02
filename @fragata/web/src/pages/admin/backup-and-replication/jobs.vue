<template>
  <VtsContentSidePanel>
    <div class="container">
      <UiCard>
        <BackupJobsTable :backup-jobs :busy="!areBackupJobsReady" :error="hasBackupJobFetchError">
          <template #title-actions>
            <MenuList placement="bottom-end">
              <template #trigger="{ open }">
                <UiButton variant="primary" accent="brand" size="medium" left-icon="fa:plus" @click="open($event)">
                  {{ t('new') }}
                </UiButton>
              </template>
              <MenuItem accent="brand" @click="openNewVmBackupJobDrawer()">{{ t('backup-job-type:vm') }}</MenuItem>
              <MenuItem accent="brand" @click="openOtherBackupJobModal('metadata')">
                {{ t('backup-job-type:metadata') }}
              </MenuItem>
              <MenuItem accent="brand" @click="openOtherBackupJobModal('mirror')">
                {{ t('backup-job-type:mirror') }}
              </MenuItem>
            </MenuList>
          </template>
        </BackupJobsTable>
      </UiCard>
    </div>

    <BackupJobSidePanel :backup-job="selectedBackupJob" @close="selectedBackupJob = undefined" />
  </VtsContentSidePanel>
</template>

<script setup lang="ts">
import BackupJobsTable from '@/modules/backup-job/components/list/BackupJobsTable.vue'
import BackupJobSidePanel from '@/modules/backup-job/components/list/panel/BackupJobSidePanel.vue'
import { useOtherBackupJobModal } from '@/modules/backup-job/composables/use-other-backup-job-modal.composable.ts'
import { useVmBackupJobDrawer } from '@/modules/backup-job/composables/use-vm-backup-job-drawer.composable.ts'
import {
  type FrontAnyXoBackupJob,
  useXoBackupJobCollection,
} from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import VtsContentSidePanel from '@core/components/layout/VtsContentSidePanel.vue'
import MenuItem from '@core/components/menu/MenuItem.vue'
import MenuList from '@core/components/menu/MenuList.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const { openNewVmBackupJobDrawer } = useVmBackupJobDrawer()
const { openOtherBackupJobModal } = useOtherBackupJobModal()

const { backupJobs, getBackupJobById, areBackupJobsReady, hasBackupJobFetchError } = useXoBackupJobCollection()

const selectedBackupJob = useRouteQuery<FrontAnyXoBackupJob | undefined>('id', {
  toData: id => getBackupJobById(id as FrontAnyXoBackupJob['id']),
  toQuery: backupJob => backupJob?.id ?? '',
})
</script>

<style scoped lang="postcss">
.container {
  height: fit-content;
  margin: 0.8rem;
}
</style>
