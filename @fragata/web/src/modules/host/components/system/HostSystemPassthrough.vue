<template>
  <UiCard>
    <UiTitle>
      {{ t('passthrough') }}
    </UiTitle>
    <UiAlert v-if="actionError !== undefined" accent="danger">{{ actionError }}</UiAlert>

    <UiCardSubtitle>{{ t('pci-devices') }}</UiCardSubtitle>
    <div v-for="pci of pcis" :key="pci.id" class="row">
      <div class="label">
        <span>{{ pci.deviceName }}</span>
        <span class="sublabel typo-body-regular-small">{{ pci.pciId }} · {{ pci.className }}</span>
      </div>
      <UiInfo :accent="pci.dom0Access === 'enabled' ? 'muted' : 'success'">
        {{ dom0AccessLabel(pci.dom0Access) }}
      </UiInfo>
      <UiButton
        v-if="pci.dom0Access === 'enabled' || pci.dom0Access === 'enable_on_reboot'"
        accent="brand"
        variant="tertiary"
        size="small"
        :busy="busyId === pci.id"
        @click="confirmDom0Access(pci, false)"
      >
        {{ t('action:enable-passthrough') }}
      </UiButton>
      <UiButton
        v-else-if="pci.dom0Access !== undefined"
        accent="brand"
        variant="tertiary"
        size="small"
        :busy="busyId === pci.id"
        @click="confirmDom0Access(pci, true)"
      >
        {{ t('action:give-back-to-dom0') }}
      </UiButton>
    </div>
    <VtsStateHero v-if="pcis.length === 0" type="no-data" format="card" horizontal size="extra-small">
      {{ t('passthrough:no-pci') }}
    </VtsStateHero>

    <UiCardSubtitle>{{ t('usb-devices') }}</UiCardSubtitle>
    <div v-for="usb of usbs" :key="usb.id" class="row">
      <div class="label">{{ usb.description }}</div>
      <UiToggle
        :model-value="usb.passthroughEnabled"
        :disabled="busyId === usb.id"
        @update:model-value="setUsb(usb.id, $event ?? false)"
      >
        {{ t('passthrough') }}
      </UiToggle>
    </div>
    <VtsStateHero v-if="usbs.length === 0" type="no-data" format="card" horizontal size="extra-small">
      {{ t('passthrough:no-usb') }}
    </VtsStateHero>
    <div>
      <UiButton accent="brand" variant="secondary" size="small" :busy="busyId === 'scan'" @click="scanUsbs()">
        {{ t('action:scan-usb-devices') }}
      </UiButton>
    </div>
  </UiCard>
</template>

<script setup lang="ts">
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { ApiError } from '@/shared/error/api.error.ts'
import { fetchGet, fetchPost } from '@/shared/utils/fetch.util.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardSubtitle from '@core/components/ui/card-subtitle/UiCardSubtitle.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import UiToggle from '@core/components/ui/toggle/UiToggle.vue'
import { useTypeToConfirmModal } from '@core/composables/modals/use-type-to-confirm-modal.ts'
import { onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

type HostPci = { id: string; pciId: string; className: string; deviceName: string; dom0Access?: string }
type HostUsb = { id: string; description: string; passthroughEnabled: boolean }

const { host } = defineProps<{
  host: FrontXoHost
}>()

const { t } = useI18n()

const pcis = ref<HostPci[]>([])
const usbs = ref<HostUsb[]>([])
const busyId = ref<string>()
const actionError = ref<string>()

async function load() {
  try {
    ;[pcis.value, usbs.value] = await Promise.all([
      fetchGet<HostPci[]>(`hosts/${host.id}/pcis`),
      fetchGet<HostUsb[]>(`hosts/${host.id}/usbs`),
    ])
  } catch (error) {
    actionError.value = errorMessage(error)
  }
}

onMounted(load)
watch(() => host.id, load)

function errorMessage(error: unknown) {
  const cause = error instanceof ApiError ? error.cause?.error : undefined
  return typeof cause === 'string' ? cause : error instanceof Error ? error.message : String(error)
}

async function run(id: string, action: () => Promise<unknown>) {
  busyId.value = id
  actionError.value = undefined
  try {
    await action()
    await load()
  } catch (error) {
    actionError.value = errorMessage(error)
  } finally {
    busyId.value = undefined
  }
}

function dom0AccessLabel(status?: string) {
  switch (status) {
    case 'enabled':
      return t('passthrough:used-by-dom0')
    case 'disabled':
      return t('passthrough:available-to-vms')
    case 'disable_on_reboot':
      return t('passthrough:available-after-reboot')
    case 'enable_on_reboot':
      return t('passthrough:dom0-after-reboot')
    default:
      return t('unknown')
  }
}

const { open: openTypeToConfirmModal } = useTypeToConfirmModal()

function confirmDom0Access(pci: HostPci, enabled: boolean) {
  return openTypeToConfirmModal({
    props: {
      accent: 'warning',
      icon: 'status:warning-picto',
      title: t('modal:pci-dom0-access-title', { device: pci.deviceName }),
      description: t('modal:pci-dom0-access-description'),
      confirmationText: host.name_label,
      confirmLabel: t('action:apply-and-reboot'),
    },
    events: {
      onConfirm: () =>
        run(pci.id, () => fetchPost(`hosts/${host.id}/actions/set_pci_dom0_access`, { pciIds: [pci.id], enabled })),
    },
  })
}

function setUsb(pusbId: string, enabled: boolean) {
  return run(pusbId, () => fetchPost(`hosts/${host.id}/actions/set_usb_passthrough`, { pusbId, enabled }))
}

function scanUsbs() {
  return run('scan', () => fetchPost(`hosts/${host.id}/actions/scan_usbs`))
}
</script>

<style scoped lang="postcss">
.row {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding-block: 0.4rem;

  .label {
    display: flex;
    flex: 1;
    flex-direction: column;
  }

  .sublabel {
    color: var(--color-neutral-txt-secondary);
  }
}
</style>
