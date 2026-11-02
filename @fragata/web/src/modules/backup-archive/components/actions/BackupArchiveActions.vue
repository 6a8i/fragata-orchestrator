<template>
  <UiButton
    v-tooltip="!canRestoreBackupArchive && restoreBackupArchiveErrorMessage"
    accent="brand"
    variant="primary"
    size="medium"
    left-icon="fa:rotate-left"
    :disabled="!canRestoreBackupArchive"
    :busy="isRestoringBackupArchive"
    @click="restoreBackupArchive()"
  >
    {{ t('action:restore') }}
  </UiButton>
  <UiButton
    v-if="backupArchive.disks.length > 0 && !backupArchive.withMemory"
    accent="brand"
    variant="secondary"
    size="medium"
    left-icon="fa:folder-open"
    @click="openFileRestore()"
  >
    {{ t('action:restore-files') }}
  </UiButton>
</template>

<script lang="ts" setup>
import { useBackupArchiveRestore } from '@/modules/backup-archive/composables/use-backup-archive-restore.composable.ts'
import type { FrontXoVmBackupArchive } from '@/modules/vm/remote-resources/use-xo-vm-backup-archive-collection.ts'
import UiButton from '@core/components/ui/button/UiButton.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { useI18n } from 'vue-i18n'

const { backupArchive } = defineProps<{
  backupArchive: FrontXoVmBackupArchive
}>()

const { t } = useI18n()

const { restoreBackupArchive, canRestoreBackupArchive, isRestoringBackupArchive, restoreBackupArchiveErrorMessage } =
  useBackupArchiveRestore(() => backupArchive)

const { open: openFileRestoreModal } = useOverlay({
  component: () => import('@/modules/backup-archive/components/modal/BackupArchiveFileRestoreModal.vue'),
  events: { onConfirm: true, onCancel: true },
})

function openFileRestore() {
  return openFileRestoreModal({ props: { backupArchive } })
}
</script>
