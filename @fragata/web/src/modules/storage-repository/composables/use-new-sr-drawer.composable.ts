import { type NewSrPayload, useXoSrCreateJob } from '@/modules/storage-repository/jobs/xo-sr-create.job.ts'
import { type NewXostorPayload, useXoXostorCreateJob } from '@/modules/storage-repository/jobs/xo-xostor-create.job.ts'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { KEEP_OVERLAY_OPEN } from '@core/packages/overlay/symbols.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { ref } from 'vue'

export function useNewSrDrawer() {
  const payload = ref<NewSrPayload>()
  const xostorPayload = ref<NewXostorPayload>()

  const { run } = useXoSrCreateJob(payload)
  const { run: runXostor } = useXoXostorCreateJob(xostorPayload)

  const selectedSrId = useRouteQuery('id')

  const { open } = useOverlay({
    component: () => import('@/modules/storage-repository/components/drawer/NewSrDrawer.vue'),
    events: {
      onConfirm: async (newPayload: NewSrPayload | NewXostorPayload) => {
        try {
          if ('disksByHost' in newPayload) {
            xostorPayload.value = newPayload
            selectedSrId.value = await runXostor()
          } else {
            payload.value = newPayload
            selectedSrId.value = await run()
          }
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
