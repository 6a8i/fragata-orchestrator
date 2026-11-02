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
    v-tooltip="!canInstallCertificate && installCertificateErrorMessage"
    accent="neutral"
    icon="fa:lock"
    :disabled="!canInstallCertificate"
    :busy="isInstallingCertificate"
    @click="openCertificate()"
  >
    {{ t('action:install-certificate') }}
  </MenuItem>
  <MenuItem
    v-tooltip="!canInstallPack && installPackErrorMessage"
    accent="neutral"
    icon="fa:compact-disc"
    :disabled="!canInstallPack"
    :busy="isInstallingPack"
    @click="openSupplementalPack()"
  >
    {{ t('action:install-supplemental-pack') }}
  </MenuItem>
  <MenuItem
    v-tooltip="!canSetMemory && setMemoryErrorMessage"
    accent="warning"
    icon="fa:memory"
    :disabled="!canSetMemory"
    :busy="isSettingMemory"
    @click="openControlDomainMemory()"
  >
    {{ t('action:set-control-domain-memory') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import {
  type EditHostPayload,
  type HostCertificatePayload,
  useXoHostEditJob,
  useXoHostInstallCertificateJob,
  useXoHostInstallSupplementalPackJob,
  useXoHostSetControlDomainMemoryJob,
} from '@/modules/host/jobs/xo-host-admin.jobs.ts'
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { KEEP_OVERLAY_OPEN } from '@core/packages/overlay/symbols.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { IK_CLOSE_MENU } from '@core/utils/injection-keys.util.ts'
import { inject, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { host } = defineProps<{
  host: FrontXoHost
}>()

const { t } = useI18n()

const closeMenu = inject(IK_CLOSE_MENU, undefined)

// settings

const editPayload = ref<EditHostPayload>()

const {
  run: edit,
  canRun: canEdit,
  isRunning: isEditing,
  errorMessage: editErrorMessage,
} = useXoHostEditJob(() => host, editPayload)

const { open: openSettingsDrawer } = useOverlay({
  component: () => import('@/modules/host/components/drawer/HostSettingsDrawer.vue'),
  events: {
    onConfirm: async (payload: EditHostPayload) => {
      if (Object.keys(payload).length === 0) {
        return
      }

      editPayload.value = payload

      try {
        await edit()
      } catch (error) {
        console.error('Failed to edit host', error)
        return KEEP_OVERLAY_OPEN
      }
    },
    onCancel: true,
  },
})

function openSettings() {
  closeMenu?.()
  return openSettingsDrawer({ props: { host } })
}

// certificate

const certificatePayload = ref<HostCertificatePayload>()

const {
  run: installCertificate,
  canRun: canInstallCertificate,
  isRunning: isInstallingCertificate,
  errorMessage: installCertificateErrorMessage,
} = useXoHostInstallCertificateJob(() => host, certificatePayload)

const { open: openCertificateModal } = useOverlay({
  component: () => import('@/modules/host/components/modal/HostCertificateModal.vue'),
  events: {
    onConfirm: (payload: HostCertificatePayload) => {
      certificatePayload.value = payload
      // the key only lives in memory for the request
      installCertificate()
        .catch(error => console.error('Failed to install the certificate', error))
        .finally(() => {
          certificatePayload.value = undefined
        })
    },
    onCancel: true,
  },
})

function openCertificate() {
  closeMenu?.()
  return openCertificateModal({ props: { host } })
}

// supplemental pack

const packFile = ref<File>()

const {
  run: installPack,
  canRun: canInstallPack,
  isRunning: isInstallingPack,
  errorMessage: installPackErrorMessage,
} = useXoHostInstallSupplementalPackJob(() => host, packFile)

const { open: openPackModal } = useOverlay({
  component: () => import('@/modules/host/components/modal/HostSupplementalPackModal.vue'),
  events: {
    onConfirm: (file: File) => {
      packFile.value = file
      installPack({ detached: true })
    },
    onCancel: true,
  },
})

function openSupplementalPack() {
  closeMenu?.()
  return openPackModal({ props: { host } })
}

// control domain memory

const controlDomainMemory = ref<number>()

const {
  run: setMemory,
  canRun: canSetMemory,
  isRunning: isSettingMemory,
  errorMessage: setMemoryErrorMessage,
} = useXoHostSetControlDomainMemoryJob(() => host, controlDomainMemory)

const { open: openMemoryModal } = useOverlay({
  component: () => import('@/modules/host/components/modal/HostControlDomainMemoryModal.vue'),
  events: {
    onConfirm: (memory: number) => {
      controlDomainMemory.value = memory
      setMemory({ detached: true })
    },
    onCancel: true,
  },
})

function openControlDomainMemory() {
  closeMenu?.()
  return openMemoryModal({ props: { host } })
}
</script>
