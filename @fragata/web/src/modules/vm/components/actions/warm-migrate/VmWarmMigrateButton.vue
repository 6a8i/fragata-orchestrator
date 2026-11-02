<template>
  <MenuItem accent="neutral" icon="action:migrate" :busy="isRunning" @click="openModal()">
    {{ t('action:warm-migrate') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { useXoTaskUtils } from '@/shared/composables/xo-task-utils.composable.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { IK_CLOSE_MENU } from '@core/utils/injection-keys.util.ts'
import type { XoTask } from '@fragata/types'
import { inject, ref } from 'vue'
import { useI18n } from 'vue-i18n'

export type WarmMigratePayload = { srId: string; startDestinationVm: boolean; deleteSourceVm: boolean }

const { vm } = defineProps<{
  vm: FrontXoVm
}>()

const { t } = useI18n()

const closeMenu = inject(IK_CLOSE_MENU, undefined)
const { monitorTask } = useXoTaskUtils()

const isRunning = ref(false)

const { open } = useOverlay({
  component: () => import('@/modules/vm/components/modal/VmWarmMigrateModal.vue'),
  events: {
    onConfirm: async (payload: WarmMigratePayload) => {
      isRunning.value = true
      try {
        const { taskId } = await fetchPost<{ taskId: XoTask['id'] }>(`vms/${vm.id}/actions/warm_migrate`, payload)
        // runs in the background: the task is listed with the other ones
        monitorTask(taskId)
          .catch(error => console.error('warm migration failed', error))
          .finally(() => {
            isRunning.value = false
          })
      } catch (error) {
        isRunning.value = false
        throw error
      }
    },
    onCancel: true,
  },
})

function openModal() {
  closeMenu?.()
  return open({ props: { vm } })
}
</script>
