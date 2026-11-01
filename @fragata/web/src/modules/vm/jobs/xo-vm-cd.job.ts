import { xoVmArg } from '@/modules/vm/jobs/xo-vm-args.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { defineJob, defineJobArg, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

// a plain string, not the branded id: the inferred branded type cannot be exported by the job
export const xoIsoVdiIdArg = defineJobArg<string>({
  identify: false,
  toArray: false,
})

export const useXoVmInsertCdJob = defineJob('vm.insert-cd', [xoVmArg, xoIsoVdiIdArg], () => {
  const { t } = useI18n()

  return {
    async run(vm: FrontXoVm, vdiId: string) {
      await fetchPost(`vms/${vm.id}/actions/insert_cd`, { vdiId, force: true })
    },

    validate(isRunning, vm: FrontXoVm | undefined, vdiId: string | undefined) {
      if (vm === undefined) {
        throw new JobError(t('job:arg:vm-required'))
      }

      if (isRunning) {
        throw new JobRunningError(t('job:vm-insert-cd:in-progress'))
      }

      // The ISO is only known once the modal is confirmed
      if (vdiId !== undefined && vdiId === '') {
        throw new JobError(t('job:vm-insert-cd:iso-required'))
      }
    },
  }
})

export const useXoVmEjectCdJob = defineJob('vm.eject-cd', [xoVmArg], () => {
  const { t } = useI18n()

  return {
    async run(vm: FrontXoVm) {
      await fetchPost(`vms/${vm.id}/actions/eject_cd`)
    },

    validate(isRunning, vm: FrontXoVm | undefined) {
      if (vm === undefined) {
        throw new JobError(t('job:arg:vm-required'))
      }

      if (isRunning) {
        throw new JobRunningError(t('job:vm-eject-cd:in-progress'))
      }
    },
  }
})
