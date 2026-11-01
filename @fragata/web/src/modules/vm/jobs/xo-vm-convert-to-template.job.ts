import { xoVmArg } from '@/modules/vm/jobs/xo-vm-args.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import type { FrontXoTask } from '@/modules/task/remote-resources/use-xo-task-collection.ts'
import { useXoTaskUtils } from '@/shared/composables/xo-task-utils.composable.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { VM_POWER_STATE } from '@fragata/types'
import { useI18n } from 'vue-i18n'

export const useXoVmConvertToTemplateJob = defineJob('vm.convert-to-template', [xoVmArg], () => {
  const { t } = useI18n()
  const { monitorTask } = useXoTaskUtils()

  return {
    async run(vm: FrontXoVm) {
      const { taskId } = await fetchPost<{ taskId: FrontXoTask['id'] }>(`vms/${vm.id}/actions/convert_to_template`)

      await monitorTask(taskId)
    },

    validate(isRunning, vm: FrontXoVm | undefined) {
      if (vm === undefined) {
        throw new JobError(t('job:arg:vm-required'))
      }

      if (vm.power_state !== VM_POWER_STATE.HALTED) {
        throw new JobError(t('job:vm-convert-to-template:vm-must-be-halted'))
      }

      if (isRunning) {
        throw new JobRunningError(t('job:vm-convert-to-template:in-progress'))
      }
    },
  }
})
