import {
  type UserPayload,
  useXoUserCreateJob,
  useXoUserDeleteJob,
  useXoUserEditJob,
} from '@/modules/user/jobs/xo-user.jobs.ts'
import type { FrontXoUser } from '@/modules/user/remote-resources/use-xo-user-collection.ts'
import { useDeleteModal } from '@core/composables/modals/use-delete-modal.ts'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { KEEP_OVERLAY_OPEN } from '@core/packages/overlay/symbols.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { type MaybeRefOrGetter, ref } from 'vue'
import { useI18n } from 'vue-i18n'

/** Create, edit and delete users; `rawUser` is the user edited or deleted */
export function useUserManagement(rawUser?: MaybeRefOrGetter<FrontXoUser | undefined>) {
  const user = toComputed(rawUser)

  const { t } = useI18n()

  const selectedUserId = useRouteQuery('id')

  const payload = ref<UserPayload>()

  const { run: runCreate } = useXoUserCreateJob(payload)
  const { run: runEdit, canRun: canEditUser } = useXoUserEditJob(user, payload)
  const {
    run: runDelete,
    canRun: canDeleteUser,
    isRunning: isDeletingUser,
    errorMessage: deleteUserErrorMessage,
  } = useXoUserDeleteJob(user)

  const drawerComponent = () => import('@/modules/user/components/drawer/UserDrawer.vue')

  const { open: openCreateDrawer } = useOverlay({
    component: drawerComponent,
    events: {
      onConfirm: async (newPayload: UserPayload) => {
        payload.value = newPayload
        try {
          selectedUserId.value = await runCreate()
        } catch (error) {
          console.error('Failed to create user', error)
          return KEEP_OVERLAY_OPEN
        }
      },
      onCancel: true,
    },
  })

  const { open: openEditDrawer } = useOverlay({
    component: drawerComponent,
    events: {
      onConfirm: async (newPayload: UserPayload) => {
        payload.value = newPayload
        try {
          await runEdit()
        } catch (error) {
          console.error('Failed to edit user', error)
          return KEEP_OVERLAY_OPEN
        }
      },
      onCancel: true,
    },
  })

  const { open: openDeleteModal } = useDeleteModal()

  function deleteUser() {
    if (user.value === undefined) {
      return
    }

    return openDeleteModal({
      props: {
        subject: user.value.name ?? user.value.email,
        confirmLabel: t('action:delete'),
        description: t('modal:delete-user-description'),
      },
      events: {
        onConfirm: () =>
          runDelete({
            detached: true,
            onSuccess: () => {
              selectedUserId.value = ''
            },
          }),
      },
    })
  }

  return {
    openNewUserDrawer: () => openCreateDrawer({ props: {} }),
    openEditUserDrawer: () => (user.value !== undefined ? openEditDrawer({ props: { user: user.value } }) : undefined),
    canEditUser,
    deleteUser,
    canDeleteUser,
    isDeletingUser,
    deleteUserErrorMessage,
  }
}
