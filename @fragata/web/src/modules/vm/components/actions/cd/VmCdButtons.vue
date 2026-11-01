<template>
  <MenuItem
    v-tooltip="!canInsert && insertErrorMessage"
    accent="neutral"
    icon="fa:compact-disc"
    :disabled="!canInsert"
    :busy="isInserting"
    @click="openInsertModal()"
  >
    {{ t('action:insert-cd') }}
  </MenuItem>
  <MenuItem
    v-tooltip="!canEject && ejectErrorMessage"
    accent="neutral"
    icon="fa:eject"
    :disabled="!canEject"
    :busy="isEjecting"
    @click="ejectCd()"
  >
    {{ t('action:eject-cd') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import { useXoVmEjectCdJob, useXoVmInsertCdJob } from '@/modules/vm/jobs/xo-vm-cd.job.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { IK_CLOSE_MENU } from '@core/utils/injection-keys.util.ts'
import { inject, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: FrontXoVm
}>()

const { t } = useI18n()

const closeMenu = inject(IK_CLOSE_MENU, undefined)

const vdiId = ref<string>()

const {
  run: insert,
  canRun: canInsert,
  isRunning: isInserting,
  errorMessage: insertErrorMessage,
} = useXoVmInsertCdJob(() => vm, vdiId)

const {
  run: eject,
  canRun: canEject,
  isRunning: isEjecting,
  errorMessage: ejectErrorMessage,
} = useXoVmEjectCdJob(() => vm)

const { open: openModal } = useOverlay({
  component: () => import('@/modules/vm/components/modal/VmInsertCdModal.vue'),
  events: {
    onConfirm: (selectedVdiId: FrontXoVdi['id']) => {
      vdiId.value = selectedVdiId
      insert({ detached: true })
    },
    onCancel: true,
  },
})

function openInsertModal() {
  closeMenu?.()
  return openModal({ props: { vm } })
}

function ejectCd() {
  closeMenu?.()
  eject({ detached: true })
}
</script>
