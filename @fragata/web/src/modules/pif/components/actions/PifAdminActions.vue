<template>
  <UiButton
    v-tooltip="!canReconfigureIp && reconfigureIpErrorMessage"
    size="medium"
    variant="tertiary"
    accent="brand"
    left-icon="action:edit"
    :disabled="!canReconfigureIp"
    :busy="isReconfiguringIp"
    @click="openIpModal({ props: { pif } })"
  >
    {{ t('action:edit-ip') }}
  </UiButton>
  <UiButton
    v-if="pif.vlan !== -1"
    v-tooltip="!canEditVlan && editVlanErrorMessage"
    size="medium"
    variant="tertiary"
    accent="brand"
    left-icon="fa:tags"
    :disabled="!canEditVlan"
    :busy="isEditingVlan"
    @click="openVlanModal({ props: { pif } })"
  >
    {{ t('action:edit-vlan') }}
  </UiButton>
  <UiButton
    v-if="pif.attached"
    v-tooltip="!canDisconnect && disconnectErrorMessage"
    size="medium"
    variant="tertiary"
    accent="danger"
    left-icon="fa:plug"
    :disabled="!canDisconnect"
    :busy="isDisconnecting"
    @click="disconnect({ detached: true })"
  >
    {{ t('action:disconnect') }}
  </UiButton>
  <UiButton
    v-else
    v-tooltip="!canConnect && connectErrorMessage"
    size="medium"
    variant="tertiary"
    accent="brand"
    left-icon="fa:plug"
    :disabled="!canConnect"
    :busy="isConnecting"
    @click="connect({ detached: true })"
  >
    {{ t('action:connect') }}
  </UiButton>
</template>

<script lang="ts" setup>
import {
  type PifIpPayload,
  useXoPifConnectJob,
  useXoPifDisconnectJob,
  useXoPifEditVlanJob,
  useXoPifReconfigureIpJob,
} from '@/modules/pif/jobs/xo-pif-admin.jobs.ts'
import type { FrontXoPif } from '@/modules/pif/remote-resources/use-xo-pif-collection.ts'
import UiButton from '@core/components/ui/button/UiButton.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { pif } = defineProps<{
  pif: FrontXoPif
}>()

const { t } = useI18n()

const ipPayload = ref<PifIpPayload>()

const {
  run: reconfigureIp,
  canRun: canReconfigureIp,
  isRunning: isReconfiguringIp,
  errorMessage: reconfigureIpErrorMessage,
} = useXoPifReconfigureIpJob(() => pif, ipPayload)

const { open: openIpModal } = useOverlay({
  component: () => import('@/modules/pif/components/modal/PifIpModal.vue'),
  events: {
    onConfirm: (payload: PifIpPayload) => {
      ipPayload.value = payload
      reconfigureIp({ detached: true })
    },
    onCancel: true,
  },
})

const vlan = ref<number>()

const {
  run: editVlan,
  canRun: canEditVlan,
  isRunning: isEditingVlan,
  errorMessage: editVlanErrorMessage,
} = useXoPifEditVlanJob(() => pif, vlan)

const { open: openVlanModal } = useOverlay({
  component: () => import('@/modules/pif/components/modal/PifVlanModal.vue'),
  events: {
    onConfirm: (newVlan: number) => {
      vlan.value = newVlan
      editVlan({ detached: true })
    },
    onCancel: true,
  },
})

const {
  run: connect,
  canRun: canConnect,
  isRunning: isConnecting,
  errorMessage: connectErrorMessage,
} = useXoPifConnectJob(() => pif)

const {
  run: disconnect,
  canRun: canDisconnect,
  isRunning: isDisconnecting,
  errorMessage: disconnectErrorMessage,
} = useXoPifDisconnectJob(() => pif)
</script>
