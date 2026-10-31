import { useXoBackupJobDeleteJob } from '@/modules/backup-job/jobs/xo-backup-job-delete.job.ts'
import type { FrontAnyXoBackupJob } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import { useDeleteModal } from '@core/composables/modals/use-delete-modal.ts'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import type { MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'

export function useBackupJobDelete(rawBackupJobs: MaybeRefOrGetter<FrontAnyXoBackupJob[]>) {
  const backupJobs = toComputed(rawBackupJobs)

  const { t } = useI18n()

  const selectedBackupJobId = useRouteQuery('id')

  const {
    run,
    canRun: canDeleteBackupJobs,
    isRunning: isDeletingBackupJobs,
    errorMessage: deleteBackupJobsErrorMessage,
  } = useXoBackupJobDeleteJob(backupJobs)

  function remove() {
    const ids = backupJobs.value.map(backupJob => backupJob.id)

    run({
      detached: true,
      onSuccess: results => {
        const isSelectedJobDeleted = results.some(
          (result, index) => result.status === 'fulfilled' && ids[index] === selectedBackupJobId.value
        )

        if (isSelectedJobDeleted) {
          selectedBackupJobId.value = ''
        }
      },
    })
  }

  const { open: openDeleteModal } = useDeleteModal()

  function deleteBackupJobs() {
    const count = backupJobs.value.length

    return openDeleteModal({
      props: {
        subject: count === 1 ? (backupJobs.value[0]?.name ?? t('untitled')) : t('n-backup-jobs', { n: count }),
        confirmLabel: t('action:delete'),
        description: t('modal:delete-backup-job-description'),
      },
      events: {
        onConfirm: remove,
      },
    })
  }

  return {
    deleteBackupJobs,
    canDeleteBackupJobs,
    isDeletingBackupJobs,
    deleteBackupJobsErrorMessage,
  }
}
