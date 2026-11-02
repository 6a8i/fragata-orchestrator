import { useOverlay } from '@core/packages/overlay/use-overlay.ts'

/** Opens a modal asking for a name, then calls `onConfirm` with it */
export function useNameInputModal() {
  const { open } = useOverlay({
    component: () => import('@/modules/user/components/modal/NameInputModal.vue'),
    events: {
      onConfirm: true,
      onCancel: true,
    },
  })

  function askName(
    props: { title: string; label: string; confirmLabel: string; initialValue?: string },
    onConfirm: (name: string) => unknown
  ) {
    // the overlay typing does not carry the payload of the `confirm` emit: the
    // modal does emit the name
    return open({ props, events: { onConfirm: onConfirm as unknown as (payload: undefined) => unknown } })
  }

  return { askName }
}
