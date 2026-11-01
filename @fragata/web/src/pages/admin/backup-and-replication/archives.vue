<template>
  <VtsContentSidePanel>
    <div class="container">
      <UiCard>
        <BackupArchivesTable
          :backup-archives
          :busy="!areBackupArchivesReady || !areBackupRepositoriesReady"
          :error="hasBackupArchiveFetchError"
        />
      </UiCard>
    </div>

    <BackupArchiveSidePanel :backup-archive="selectedBackupArchive" @close="selectedBackupArchive = undefined" />
  </VtsContentSidePanel>
</template>

<script setup lang="ts">
import BackupArchivesTable from '@/modules/backup-archive/components/list/BackupArchivesTable.vue'
import BackupArchiveSidePanel from '@/modules/backup-archive/components/list/panel/BackupArchiveSidePanel.vue'
import { useXoBackupRepositoryCollection } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import {
  type FrontXoVmBackupArchive,
  useXoVmBackupArchiveCollection,
} from '@/modules/vm/remote-resources/use-xo-vm-backup-archive-collection.ts'
import VtsContentSidePanel from '@core/components/layout/VtsContentSidePanel.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { computed } from 'vue'

const { backupRepositories, areBackupRepositoriesReady } = useXoBackupRepositoryCollection()

const backupRepositoryIds = computed(() => backupRepositories.value.map(br => br.id))

const { backupArchives, getBackupArchiveById, areBackupArchivesReady, hasBackupArchiveFetchError } =
  useXoVmBackupArchiveCollection({}, backupRepositoryIds)

const selectedBackupArchive = useRouteQuery<FrontXoVmBackupArchive | undefined>('id', {
  toData: id => getBackupArchiveById(id as FrontXoVmBackupArchive['id']),
  toQuery: backupArchive => backupArchive?.id ?? '',
})
</script>

<style scoped lang="postcss">
.container {
  height: fit-content;
  margin: 0.8rem;
}
</style>
