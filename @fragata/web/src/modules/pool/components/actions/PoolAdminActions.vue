<template>
  <MenuItem
    v-tooltip="!canEdit && editErrorMessage"
    accent="neutral"
    icon="action:edit"
    :disabled="!canEdit"
    :busy="isEditing"
    @click="openSettings()"
  >
    {{ t('action:edit-settings') }}
  </MenuItem>
  <MenuItem
    v-tooltip="!canSetMaster && setMasterErrorMessage"
    accent="neutral"
    icon="fa:star"
    :disabled="!canSetMaster"
    :busy="isSettingMaster"
    @click="openSetMaster()"
  >
    {{ t('action:change-master') }}
  </MenuItem>
  <MenuItem
    v-if="pool.HA_enabled"
    v-tooltip="!canDisableHa && disableHaErrorMessage"
    accent="danger"
    icon="fa:shield-halved"
    :disabled="!canDisableHa"
    :busy="isDisablingHa"
    @click="confirmDisableHa()"
  >
    {{ t('action:disable-ha') }}
  </MenuItem>
  <MenuItem
    v-else
    v-tooltip="!canEnableHa && enableHaErrorMessage"
    accent="neutral"
    icon="fa:shield-halved"
    :disabled="!canEnableHa"
    :busy="isEnablingHa"
    @click="openEnableHa()"
  >
    {{ t('action:enable-ha') }}
  </MenuItem>
  <MenuSeparator />
  <MenuItem
    v-tooltip="!canInstallPatches && installPatchesErrorMessage"
    accent="warning"
    icon="fa:download"
    :disabled="!canInstallPatches"
    :busy="isInstallingPatches"
    @click="confirmRolling('patches')"
  >
    {{ t('action:install-patches') }}
  </MenuItem>
  <MenuItem
    v-tooltip="!canRollingUpdate && rollingUpdateErrorMessage"
    accent="warning"
    icon="fa:repeat"
    :disabled="!canRollingUpdate"
    :busy="isRollingUpdating"
    @click="confirmRolling('update')"
  >
    {{ t('action:rolling-pool-update') }}
  </MenuItem>
  <MenuItem
    v-tooltip="!canRollingReboot && rollingRebootErrorMessage"
    accent="warning"
    icon="fa:rotate"
    :disabled="!canRollingReboot"
    :busy="isRollingRebooting"
    @click="confirmRolling('reboot')"
  >
    {{ t('action:rolling-pool-reboot') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import {
  type EditPoolPayload,
  useXoPoolDisableHaJob,
  useXoPoolEditJob,
  useXoPoolEnableHaJob,
  useXoPoolInstallPatchesJob,
  useXoPoolRollingRebootJob,
  useXoPoolRollingUpdateJob,
  useXoPoolSetMasterJob,
} from '@/modules/pool/jobs/xo-pool.jobs.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import MenuSeparator from '@core/components/menu/MenuSeparator.vue'
import { useTypeToConfirmModal } from '@core/composables/modals/use-type-to-confirm-modal.ts'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { KEEP_OVERLAY_OPEN } from '@core/packages/overlay/symbols.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { IK_CLOSE_MENU } from '@core/utils/injection-keys.util.ts'
import { inject, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { pool } = defineProps<{
  pool: FrontXoPool
}>()

const { t } = useI18n()

const closeMenu = inject(IK_CLOSE_MENU, undefined)

// settings

const editPayload = ref<EditPoolPayload>()

const {
  run: edit,
  canRun: canEdit,
  isRunning: isEditing,
  errorMessage: editErrorMessage,
} = useXoPoolEditJob(() => pool, editPayload)

const { open: openSettingsDrawer } = useOverlay({
  component: () => import('@/modules/pool/components/drawer/PoolSettingsDrawer.vue'),
  events: {
    onConfirm: async (payload: EditPoolPayload) => {
      if (Object.keys(payload).length === 0) {
        return
      }

      editPayload.value = payload

      try {
        await edit()
      } catch (error) {
        console.error('Failed to edit pool', error)
        return KEEP_OVERLAY_OPEN
      }
    },
    onCancel: true,
  },
})

function openSettings() {
  closeMenu?.()
  return openSettingsDrawer({ props: { pool } })
}

// master

const masterHostId = ref<string>()

const {
  run: setMaster,
  canRun: canSetMaster,
  isRunning: isSettingMaster,
  errorMessage: setMasterErrorMessage,
} = useXoPoolSetMasterJob(() => pool, masterHostId)

const { open: openSetMasterModal } = useOverlay({
  component: () => import('@/modules/pool/components/modal/PoolSetMasterModal.vue'),
  events: {
    onConfirm: (hostId: string) => {
      masterHostId.value = hostId
      setMaster({ detached: true })
    },
    onCancel: true,
  },
})

function openSetMaster() {
  closeMenu?.()
  return openSetMasterModal({ props: { pool } })
}

// HA

const heartbeatSrIds = ref<string[]>()

const {
  run: enableHa,
  canRun: canEnableHa,
  isRunning: isEnablingHa,
  errorMessage: enableHaErrorMessage,
} = useXoPoolEnableHaJob(() => pool, heartbeatSrIds)

const {
  run: disableHa,
  canRun: canDisableHa,
  isRunning: isDisablingHa,
  errorMessage: disableHaErrorMessage,
} = useXoPoolDisableHaJob(() => pool)

const { open: openEnableHaModal } = useOverlay({
  component: () => import('@/modules/pool/components/modal/PoolEnableHaModal.vue'),
  events: {
    onConfirm: (srIds: string[]) => {
      heartbeatSrIds.value = srIds
      enableHa({ detached: true })
    },
    onCancel: true,
  },
})

function openEnableHa() {
  closeMenu?.()
  return openEnableHaModal({ props: { pool } })
}

const { open: openTypeToConfirmModal } = useTypeToConfirmModal()

function confirmDisableHa() {
  closeMenu?.()

  return openTypeToConfirmModal({
    props: {
      accent: 'danger',
      icon: 'status:danger-picto',
      title: t('modal:pool-disable-ha-title', { name: pool.name_label }),
      description: t('modal:pool-disable-ha-description'),
      confirmationText: pool.name_label,
      confirmLabel: t('action:disable-ha'),
    },
    events: {
      onConfirm: () => disableHa({ detached: true }),
    },
  })
}

// rolling operations

const {
  run: rollingUpdate,
  canRun: canRollingUpdate,
  isRunning: isRollingUpdating,
  errorMessage: rollingUpdateErrorMessage,
} = useXoPoolRollingUpdateJob(() => pool)

const {
  run: rollingReboot,
  canRun: canRollingReboot,
  isRunning: isRollingRebooting,
  errorMessage: rollingRebootErrorMessage,
} = useXoPoolRollingRebootJob(() => pool)

const {
  run: installPatches,
  canRun: canInstallPatches,
  isRunning: isInstallingPatches,
  errorMessage: installPatchesErrorMessage,
} = useXoPoolInstallPatchesJob(() => pool)

const ROLLING = {
  update: {
    title: 'modal:rolling-pool-update-title',
    description: 'modal:rolling-pool-update-description',
    label: 'action:rolling-pool-update',
    run: rollingUpdate,
  },
  reboot: {
    title: 'modal:rolling-pool-reboot-title',
    description: 'modal:rolling-pool-reboot-description',
    label: 'action:rolling-pool-reboot',
    run: rollingReboot,
  },
  patches: {
    title: 'modal:pool-install-patches-title',
    description: 'modal:pool-install-patches-description',
    label: 'action:install-patches',
    run: installPatches,
  },
} as const

function confirmRolling(kind: keyof typeof ROLLING) {
  closeMenu?.()

  const { title, description, label, run } = ROLLING[kind]

  return openTypeToConfirmModal({
    props: {
      accent: 'warning',
      icon: 'status:warning-picto',
      title: t(title, { name: pool.name_label }),
      description: t(description),
      confirmationText: pool.name_label,
      confirmLabel: t(label),
    },
    events: {
      onConfirm: () => run({ detached: true }),
    },
  })
}
</script>
