import type { VmBackupJobPayload } from '@/modules/backup-job/form/use-vm-backup-job-form.ts'
import type { FrontAnyXoBackupJob } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import type { FrontXoSchedule } from '@/modules/schedule/remote-resources/use-xo-schedule-collection.ts'
import { defineJobArg } from '@core/packages/job'

export const xoBackupJobArg = defineJobArg({
  identify: (backupJob: FrontAnyXoBackupJob) => backupJob.id,
  toArray: false,
})

export const xoBackupJobsArg = defineJobArg({
  identify: (backupJob: FrontAnyXoBackupJob) => backupJob.id,
  toArray: true,
})

export const vmBackupJobPayloadArg = defineJobArg<VmBackupJobPayload>({
  identify: false,
  toArray: false,
})

export const xoScheduleArg = defineJobArg<FrontXoSchedule | undefined>({
  identify: false,
  toArray: false,
})
