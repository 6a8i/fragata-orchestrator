import { xoBackupJobArg, xoScheduleArg } from '@/modules/backup-job/jobs/xo-backup-job-args.ts'
import type { FrontAnyXoBackupJob } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import type { FrontXoSchedule } from '@/modules/schedule/remote-resources/use-xo-schedule-collection.ts'
import type { FrontXoTask } from '@/modules/task/remote-resources/use-xo-task-collection.ts'
import { useXoTaskUtils } from '@/shared/composables/xo-task-utils.composable.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

export const useXoBackupJobRunJob = defineJob('backup-job.run', [xoBackupJobArg, xoScheduleArg], () => {
  const { t } = useI18n()
  const { monitorTask } = useXoTaskUtils()

  return {
    async run(backupJob: FrontAnyXoBackupJob, schedule: FrontXoSchedule | undefined) {
      const { taskId } = await fetchPost<{ taskId: FrontXoTask['id'] }>(`backup-jobs/${backupJob.id}/actions/run`, {
        ...(schedule !== undefined && { scheduleId: schedule.id }),
      })

      await monitorTask(taskId)
    },

    validate(isRunning, backupJob: FrontAnyXoBackupJob | undefined) {
      if (backupJob === undefined) {
        throw new JobError(t('job:arg:backup-job-required'))
      }

      if (isRunning) {
        throw new JobRunningError(t('job:backup-job-run:in-progress'))
      }
    },
  }
})
