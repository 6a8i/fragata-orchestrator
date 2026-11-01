import { xoVmArg } from '@/modules/vm/jobs/xo-vm-args.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { fetchPatch } from '@/shared/utils/fetch.util.ts'
import { defineJob, defineJobArg, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

/** Subset of the `PATCH /vms/{id}` body the settings drawer can change */
export type EditVmPayload = {
  nameLabel?: string
  nameDescription?: string
  autoPoweron?: boolean
  highAvailability?: 'best-effort' | 'restart' | ''
  startDelay?: number
  cpus?: number
  cpusStaticMax?: number
  coresPerSocket?: number | null
  cpuWeight?: number | null
  cpuCap?: number | null
  memoryMin?: number
  memory?: number
  memoryStaticMax?: number
  hvmBootFirmware?: string | null
  bootOrder?: string
  secureBoot?: boolean
  viridian?: boolean
  hasVendorDevice?: boolean
  nestedVirt?: boolean
  vga?: 'std' | 'cirrus'
  videoram?: 1 | 2 | 4 | 8 | 16
}

export const editVmPayloadArg = defineJobArg<EditVmPayload>({
  identify: false,
  toArray: false,
})

export const useXoVmEditJob = defineJob('vm.edit', [xoVmArg, editVmPayloadArg], () => {
  const { t } = useI18n()

  return {
    async run(vm: FrontXoVm, payload: EditVmPayload) {
      await fetchPatch(`vms/${vm.id}`, payload)
    },

    validate(isRunning, vm: FrontXoVm | undefined, payload: EditVmPayload | undefined) {
      if (vm === undefined) {
        throw new JobError(t('job:arg:vm-required'))
      }

      if (isRunning) {
        throw new JobRunningError(t('job:edit:in-progress'))
      }

      // The payload only exists once the drawer is confirmed
      if (payload === undefined) {
        return
      }

      if (payload.nameLabel === '') {
        throw new JobError(t('job:arg:name-required'))
      }

      if (Object.keys(payload).length === 0) {
        throw new JobError(t('job:vm-edit:nothing-to-change'))
      }
    },
  }
})
