import type { VmBackupJobPayload } from '@/modules/backup-job/form/use-vm-backup-job-form.ts'
import { vmBackupJobPayloadArg, xoBackupJobArg, xoScheduleArg } from '@/modules/backup-job/jobs/xo-backup-job-args.ts'
import { validateVmBackupJobPayload } from '@/modules/backup-job/jobs/xo-backup-job-create.job.ts'
import type { FrontAnyXoBackupJob } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import type { FrontXoSchedule } from '@/modules/schedule/remote-resources/use-xo-schedule-collection.ts'
import { fetchPatch, fetchPost } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

export const useXoVmBackupJobEditJob = defineJob(
  'backup-job.edit',
  [xoBackupJobArg, xoScheduleArg, vmBackupJobPayloadArg],
  () => {
    const { t } = useI18n()

    return {
      async run(backupJob: FrontAnyXoBackupJob, schedule: FrontXoSchedule | undefined, payload: VmBackupJobPayload) {
        if (backupJob.type !== 'backup') {
          throw new JobError(t('job:backup-job:vm-job-only'))
        }

        let scheduleId: FrontXoSchedule['id']

        if (schedule === undefined) {
          // the job had no schedule: create one, then attach its settings below
          const created = await fetchPost<{ id: FrontXoSchedule['id'] }>('schedules', {
            ...payload.schedule,
            jobId: backupJob.id,
          })
          scheduleId = created.id
        } else {
          scheduleId = schedule.id
          await fetchPatch(`schedules/${schedule.id}`, payload.schedule)
        }

        // the settings of the other schedules of the job are kept as they are
        const { '': _previousGeneral, ...otherSettings } = backupJob.settings as Record<string, unknown>

        await fetchPatch(`backup-jobs/vm/${backupJob.id}`, {
          ...payload.job,
          settings: {
            ...otherSettings,
            '': payload.generalSettings,
            [scheduleId]: payload.scheduleSettings,
          },
        })
      },

      validate(
        isRunning,
        backupJob: FrontAnyXoBackupJob | undefined,
        _schedule: FrontXoSchedule | undefined,
        payload: VmBackupJobPayload | undefined
      ) {
        if (backupJob === undefined) {
          throw new JobError(t('job:arg:backup-job-required'))
        }

        if (backupJob.type !== 'backup') {
          throw new JobError(t('job:backup-job:vm-job-only'))
        }

        if (isRunning) {
          throw new JobRunningError(t('job:edit:in-progress'))
        }

        // The payload only exists once the drawer is confirmed
        if (payload === undefined) {
          return
        }

        validateVmBackupJobPayload(payload, t)
      },
    }
  }
)
