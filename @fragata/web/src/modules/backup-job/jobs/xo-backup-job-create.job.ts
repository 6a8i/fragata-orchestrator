import type { VmBackupJobPayload } from '@/modules/backup-job/form/use-vm-backup-job-form.ts'
import { vmBackupJobPayloadArg } from '@/modules/backup-job/jobs/xo-backup-job-args.ts'
import type { FrontXoVmBackupJob } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

// temporary key of the schedule created with the job (see the REST API)
const NEW_SCHEDULE_KEY = 'new-schedule'

export const useXoVmBackupJobCreateJob = defineJob('backup-job.create', [vmBackupJobPayloadArg], () => {
  const { t } = useI18n()

  return {
    async run(payload: VmBackupJobPayload): Promise<FrontXoVmBackupJob['id']> {
      const { id } = await fetchPost<{ id: FrontXoVmBackupJob['id'] }>('backup-jobs/vm', {
        ...payload.job,
        settings: {
          '': payload.generalSettings,
          [NEW_SCHEDULE_KEY]: payload.scheduleSettings,
        },
        schedules: {
          [NEW_SCHEDULE_KEY]: payload.schedule,
        },
      })

      return id
    },

    validate(isRunning, payload: VmBackupJobPayload | undefined) {
      if (isRunning) {
        throw new JobRunningError(t('job:create:in-progress'))
      }

      if (payload === undefined) {
        throw new JobError(t('job:arg:missing-payload'))
      }

      validateVmBackupJobPayload(payload, t)
    },
  }
})

export function validateVmBackupJobPayload(payload: VmBackupJobPayload, t: (key: string) => string) {
  if (payload.job.name === '') {
    throw new JobError(t('job:arg:name-required'))
  }

  if (payload.job.vms.id.__or.length === 0) {
    throw new JobError(t('job:backup-job:vms-required'))
  }

  const hasBackupRepositories = (payload.job.remotes?.id.__or.length ?? 0) > 0
  const hasReplicationTargets = (payload.job.srs?.id.__or.length ?? 0) > 0
  const { exportRetention = 0, copyRetention = 0, snapshotRetention = 0 } = payload.scheduleSettings

  if (hasBackupRepositories && exportRetention < 1) {
    throw new JobError(t('job:backup-job:export-retention-required'))
  }

  if (hasReplicationTargets && copyRetention < 1) {
    throw new JobError(t('job:backup-job:copy-retention-required'))
  }

  if (!hasBackupRepositories && !hasReplicationTargets && snapshotRetention < 1) {
    throw new JobError(t('job:backup-job:target-required'))
  }

  if (payload.schedule.cron.trim() === '') {
    throw new JobError(t('job:backup-job:cron-required'))
  }
}
