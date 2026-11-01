import { type EditVmPayload, useXoVmEditJob } from '@/modules/vm/jobs/xo-vm-edit.job.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { KEEP_OVERLAY_OPEN } from '@core/packages/overlay/symbols.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { type MaybeRefOrGetter, ref } from 'vue'

export function useVmSettingsDrawer(rawVm: MaybeRefOrGetter<FrontXoVm | undefined>) {
  const vm = toComputed(rawVm)

  const payload = ref<EditVmPayload>()

  const { run, canRun: canEditVm, isRunning: isEditingVm, errorMessage: editVmErrorMessage } = useXoVmEditJob(vm, payload)

  const { open: openDrawer } = useOverlay({
    component: () => import('@/modules/vm/components/drawer/VmSettingsDrawer.vue'),
    events: {
      onConfirm: async (newPayload: EditVmPayload) => {
        if (Object.keys(newPayload).length === 0) {
          // nothing changed: just close
          return
        }

        payload.value = newPayload

        try {
          await run()
        } catch (error) {
          console.error('Failed to edit VM', error)
          return KEEP_OVERLAY_OPEN
        }
      },
      onCancel: true,
    },
  })

  function openVmSettingsDrawer() {
    if (vm.value === undefined) {
      return
    }

    return openDrawer({ props: { vm: vm.value } })
  }

  return { openVmSettingsDrawer, canEditVm, isEditingVm, editVmErrorMessage }
}
