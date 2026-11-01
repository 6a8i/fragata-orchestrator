import {
  type RestoreBackupArchivePayload,
  useXoBackupArchiveRestoreJob,
} from '@/modules/backup-archive/jobs/xo-backup-archive-restore.job.ts'
import type { FrontXoVmBackupArchive } from '@/modules/vm/remote-resources/use-xo-vm-backup-archive-collection.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { type MaybeRefOrGetter, ref } from 'vue'

export function useBackupArchiveRestore(rawBackupArchive: MaybeRefOrGetter<FrontXoVmBackupArchive | undefined>) {
  const backupArchive = toComputed(rawBackupArchive)

  const payload = ref<RestoreBackupArchivePayload>()

  const {
    run,
    canRun: canRestoreBackupArchive,
    isRunning: isRestoringBackupArchive,
    errorMessage: restoreBackupArchiveErrorMessage,
  } = useXoBackupArchiveRestoreJob(backupArchive, payload)

  const { open: openRestoreModal } = useOverlay({
    component: () => import('@/modules/backup-archive/components/modal/BackupArchiveRestoreModal.vue'),
    events: {
      onConfirm: (newPayload: RestoreBackupArchivePayload) => {
        payload.value = newPayload
        // the restore can take a long time: it runs as a task the user can follow in the task list
        run({ detached: true })
      },
      onCancel: true,
    },
  })

  function restoreBackupArchive() {
    if (backupArchive.value === undefined) {
      return
    }

    return openRestoreModal({ props: { backupArchive: backupArchive.value } })
  }

  return {
    restoreBackupArchive,
    canRestoreBackupArchive,
    isRestoringBackupArchive,
    restoreBackupArchiveErrorMessage,
  }
}
