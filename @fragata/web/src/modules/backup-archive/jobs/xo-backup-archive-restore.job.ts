import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import type { FrontXoTask } from '@/modules/task/remote-resources/use-xo-task-collection.ts'
import type { FrontXoVmBackupArchive } from '@/modules/vm/remote-resources/use-xo-vm-backup-archive-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { useXoTaskUtils } from '@/shared/composables/xo-task-utils.composable.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { defineJob, defineJobArg, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

export type RestoreBackupArchivePayload = {
  srId: FrontXoSr['id']
  vmNamePrefix?: string
  generateNewMacAddresses: boolean
  startOnRestore: boolean
}

export const xoBackupArchiveArg = defineJobArg({
  identify: (backupArchive: FrontXoVmBackupArchive) => backupArchive.id,
  toArray: false,
})

export const restoreBackupArchivePayloadArg = defineJobArg<RestoreBackupArchivePayload>({
  identify: false,
  toArray: false,
})

export const useXoBackupArchiveRestoreJob = defineJob(
  'backup-archive.restore',
  [xoBackupArchiveArg, restoreBackupArchivePayloadArg],
  () => {
    const { t } = useI18n()
    const { monitorTask } = useXoTaskUtils()

    return {
      async run(backupArchive: FrontXoVmBackupArchive, payload: RestoreBackupArchivePayload) {
        const { taskId } = await fetchPost<{ taskId: FrontXoTask['id'] }>(
          `backup-archives/${encodeURIComponent(backupArchive.id)}/actions/restore`,
          payload
        )

        return monitorTask<{ id: FrontXoVm['id'] }>(taskId)
      },

      validate(
        isRunning,
        backupArchive: FrontXoVmBackupArchive | undefined,
        payload: RestoreBackupArchivePayload | undefined
      ) {
        if (backupArchive === undefined) {
          throw new JobError(t('job:arg:backup-archive-required'))
        }

        if (isRunning) {
          throw new JobRunningError(t('job:backup-archive-restore:in-progress'))
        }

        // The payload only exists once the modal is confirmed
        if (payload !== undefined && payload.srId === undefined) {
          throw new JobError(t('target-storage-repository-required'))
        }
      },
    }
  }
)
