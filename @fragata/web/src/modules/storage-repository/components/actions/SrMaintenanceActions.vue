<template>
  <MenuItem
    v-tooltip="!canScan && scanErrorMessage"
    accent="neutral"
    icon="fa:rotate"
    :disabled="!canScan"
    :busy="isScanning"
    @click="runAndClose(scan)"
  >
    {{ t('action:scan') }}
  </MenuItem>
  <MenuItem
    v-tooltip="!canReclaim && reclaimErrorMessage"
    accent="neutral"
    icon="fa:broom"
    :disabled="!canReclaim"
    :busy="isReclaiming"
    @click="runAndClose(reclaim)"
  >
    {{ t('action:reclaim-space') }}
  </MenuItem>
  <MenuItem
    v-if="sr.inMaintenanceMode"
    v-tooltip="!canDisable && disableErrorMessage"
    accent="neutral"
    icon="fa:play"
    :disabled="!canDisable"
    :busy="isDisabling"
    @click="runAndClose(disableMaintenance)"
  >
    {{ t('action:disable-maintenance-mode') }}
  </MenuItem>
  <MenuItem
    v-else
    v-tooltip="!canEnable && enableErrorMessage"
    accent="danger"
    icon="fa:screwdriver-wrench"
    :disabled="!canEnable"
    :busy="isEnabling"
    @click="confirmMaintenance()"
  >
    {{ t('action:enable-maintenance-mode') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import {
  useXoSrDisableMaintenanceJob,
  useXoSrEnableMaintenanceJob,
  useXoSrReclaimSpaceJob,
  useXoSrScanJob,
} from '@/modules/storage-repository/jobs/xo-sr-maintenance.job.ts'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { useTypeToConfirmModal } from '@core/composables/modals/use-type-to-confirm-modal.ts'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { IK_CLOSE_MENU } from '@core/utils/injection-keys.util.ts'
import { inject } from 'vue'
import { useI18n } from 'vue-i18n'

const { sr } = defineProps<{
  sr: FrontXoSr
}>()

const { t } = useI18n()

const closeMenu = inject(IK_CLOSE_MENU, undefined)

const {
  run: scan,
  canRun: canScan,
  isRunning: isScanning,
  errorMessage: scanErrorMessage,
} = useXoSrScanJob(() => sr)

const {
  run: reclaim,
  canRun: canReclaim,
  isRunning: isReclaiming,
  errorMessage: reclaimErrorMessage,
} = useXoSrReclaimSpaceJob(() => sr)

const {
  run: enableMaintenance,
  canRun: canEnable,
  isRunning: isEnabling,
  errorMessage: enableErrorMessage,
} = useXoSrEnableMaintenanceJob(() => sr)

const {
  run: disableMaintenance,
  canRun: canDisable,
  isRunning: isDisabling,
  errorMessage: disableErrorMessage,
} = useXoSrDisableMaintenanceJob(() => sr)

function runAndClose(run: (opts: { detached: true }) => unknown) {
  closeMenu?.()
  run({ detached: true })
}

const { open: openTypeToConfirmModal } = useTypeToConfirmModal()

function confirmMaintenance() {
  closeMenu?.()

  return openTypeToConfirmModal({
    props: {
      accent: 'danger',
      icon: 'status:danger-picto',
      title: t('modal:sr-maintenance-title', { name: sr.name_label }),
      description: t('modal:sr-maintenance-description'),
      confirmationText: sr.name_label,
      confirmLabel: t('action:enable-maintenance-mode'),
    },
    events: {
      onConfirm: () => enableMaintenance({ detached: true }),
    },
  })
}
</script>
