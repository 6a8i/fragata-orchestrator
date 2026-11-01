import { type NewSrPayload, useXoSrCreateJob } from '@/modules/storage-repository/jobs/xo-sr-create.job.ts'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { KEEP_OVERLAY_OPEN } from '@core/packages/overlay/symbols.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { ref } from 'vue'

export function useNewSrDrawer() {
  const payload = ref<NewSrPayload>()

  const { run } = useXoSrCreateJob(payload)

  const selectedSrId = useRouteQuery('id')

  const { open } = useOverlay({
    component: () => import('@/modules/storage-repository/components/drawer/NewSrDrawer.vue'),
    events: {
      onConfirm: async (newPayload: NewSrPayload) => {
        payload.value = newPayload

        try {
          selectedSrId.value = await run()
        } catch (error) {
          console.error('Failed to create SR', error)
          return KEEP_OVERLAY_OPEN
        }
      },
      onCancel: true,
    },
  })

  function openNewSrDrawer(poolId: string, hostId?: string) {
    return open({ props: { poolId, hostId } })
  }

  return { openNewSrDrawer }
}
