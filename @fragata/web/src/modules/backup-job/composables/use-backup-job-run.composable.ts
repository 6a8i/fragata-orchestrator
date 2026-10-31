import { useXoBackupJobRunJob } from '@/modules/backup-job/jobs/xo-backup-job-run.job.ts'
import type { FrontAnyXoBackupJob } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import { type FrontXoSchedule, useXoScheduleCollection } from '@/modules/schedule/remote-resources/use-xo-schedule-collection.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter, ref } from 'vue'

export function useBackupJobRun(rawBackupJob: MaybeRefOrGetter<FrontAnyXoBackupJob | undefined>) {
  const backupJob = toComputed(rawBackupJob)

  const { schedulesByJobId } = useXoScheduleCollection()

  const schedules = computed<FrontXoSchedule[]>(() =>
    backupJob.value !== undefined ? (schedulesByJobId.value.get(backupJob.value.id) ?? []) : []
  )

  const scheduleToRun = ref<FrontXoSchedule>()

  const {
    run,
    canRun: canRunBackupJob,
    isRunning: isRunningBackupJob,
    errorMessage: runBackupJobErrorMessage,
  } = useXoBackupJobRunJob(backupJob, scheduleToRun)

  function runBackupJob(schedule?: FrontXoSchedule) {
    // without an explicit choice, the server picks the first schedule of the job
    scheduleToRun.value = schedule
    return run({ detached: true })
  }

  return {
    schedules,
    hasSchedule: computed(() => schedules.value.length > 0),
    runBackupJob,
    canRunBackupJob,
    isRunningBackupJob,
    runBackupJobErrorMessage,
  }
}
