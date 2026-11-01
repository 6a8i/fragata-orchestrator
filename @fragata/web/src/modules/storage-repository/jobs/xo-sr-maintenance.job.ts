import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import type { FrontXoTask } from '@/modules/task/remote-resources/use-xo-task-collection.ts'
import { useXoTaskUtils } from '@/shared/composables/xo-task-utils.composable.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { defineJob, defineJobArg, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

export const xoSingleSrArg = defineJobArg({
  identify: (sr: FrontXoSr) => sr.id,
  toArray: false,
})

function defineSrTaskAction(name: string, path: string, inProgressKey: string, body?: () => unknown) {
  return defineJob(name, [xoSingleSrArg], () => {
    const { t } = useI18n()
    const { monitorTask } = useXoTaskUtils()

    return {
      async run(sr: FrontXoSr) {
        const { taskId } = await fetchPost<{ taskId: FrontXoTask['id'] }>(`srs/${sr.id}/actions/${path}`, body?.())
        await monitorTask(taskId)
      },

      validate(isRunning, sr: FrontXoSr | undefined) {
        if (sr === undefined) {
          throw new JobError(t('job:sr-delete:missing-sr'))
        }

        if (isRunning) {
          throw new JobRunningError(t(inProgressKey))
        }
      },
    }
  })
}

export const useXoSrScanJob = defineSrTaskAction('sr.scan', 'scan', 'job:sr-scan:in-progress')

export const useXoSrReclaimSpaceJob = defineSrTaskAction(
  'sr.reclaim-space',
  'reclaim_space',
  'job:sr-reclaim-space:in-progress'
)

// VMs using the SR are shut down: the confirmation modal says so
export const useXoSrEnableMaintenanceJob = defineSrTaskAction(
  'sr.enable-maintenance',
  'enable_maintenance_mode',
  'job:sr-maintenance:in-progress',
  () => ({ shutdownVms: true })
)

export const useXoSrDisableMaintenanceJob = defineSrTaskAction(
  'sr.disable-maintenance',
  'disable_maintenance_mode',
  'job:sr-maintenance:in-progress'
)
