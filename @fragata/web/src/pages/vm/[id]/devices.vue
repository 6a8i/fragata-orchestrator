<template>
  <VtsStateHero v-if="!areDevicesReady" format="card" type="busy" size="medium" />
  <div v-else class="vm-devices">
    <UiAlert v-if="actionError !== undefined" accent="danger">{{ actionError }}</UiAlert>
    <UiAlert v-if="!isHalted" accent="info">{{ t('vm-devices:halted-hint') }}</UiAlert>

    <VtsColumns extra-space-around>
      <VtsColumn>
        <VmDeviceListCard
          :title="t('pci-passthrough')"
          icon="fa:microchip"
          :items="pciItems"
          :empty-label="t('vm-devices:no-pci')"
          :remove-label="t('action:detach')"
          :hint="t('vm-devices:pci-hint')"
          :busy-id
          @remove="run($event, () => detachVmPcis(vm.id, [$event]))"
        >
          <template #add>
            <VtsSelect :id="pciSelectId" accent="brand" />
            <UiButton
              accent="brand"
              variant="primary"
              size="small"
              left-icon="fa:plus"
              :disabled="pciToAttach === undefined"
              :busy="busyId === 'add-pci'"
              @click="run('add-pci', () => attachVmPcis(vm.id, [pciToAttach!]))"
            >
              {{ t('action:attach') }}
            </UiButton>
          </template>
        </VmDeviceListCard>

        <VmDeviceListCard
          :title="t('vgpus')"
          icon="fa:display"
          :items="vgpuItems"
          :empty-label="t('vm-devices:no-vgpu')"
          :remove-label="t('action:delete')"
          :disabled="!isHalted"
          :busy-id
          @remove="run($event, () => deleteVmVgpu(vm.id, $event))"
        >
          <template v-if="devices.availableGpuGroups.length > 0" #add>
            <VtsSelect :id="vgpuTypeSelectId" accent="brand" />
            <UiButton
              accent="brand"
              variant="primary"
              size="small"
              left-icon="fa:plus"
              :disabled="!isHalted || vgpuChoice === undefined"
              :busy="busyId === 'add-vgpu'"
              @click="addVgpu()"
            >
              {{ t('action:add') }}
            </UiButton>
          </template>
        </VmDeviceListCard>
      </VtsColumn>

      <VtsColumn>
        <VmDeviceListCard
          :title="t('vtpm')"
          icon="fa:lock"
          :items="vtpmItems"
          :empty-label="t('vm-devices:no-vtpm')"
          :remove-label="t('action:delete')"
          :hint="t('vm-devices:vtpm-hint')"
          :disabled="!isHalted"
          :busy-id
          @remove="confirmDeleteVtpm($event)"
        >
          <template v-if="devices.vtpms.length === 0" #add>
            <span />
            <UiButton
              accent="brand"
              variant="primary"
              size="small"
              left-icon="fa:plus"
              :disabled="!isHalted || !isUefi"
              :busy="busyId === 'add-vtpm'"
              @click="run('add-vtpm', () => createVmVtpm(vm.id))"
            >
              {{ t('action:add') }}
            </UiButton>
          </template>
        </VmDeviceListCard>

        <VmDeviceListCard
          :title="t('usb-passthrough')"
          icon="fa:plug"
          :items="usbItems"
          :empty-label="t('vm-devices:no-usb')"
          :remove-label="t('action:delete')"
          :hint="t('vm-devices:usb-hint')"
          :busy-id
          @remove="run($event, () => deleteVmVusb(vm.id, $event))"
        >
          <template #add>
            <VtsSelect :id="usbSelectId" accent="brand" />
            <UiButton
              accent="brand"
              variant="primary"
              size="small"
              left-icon="fa:plus"
              :disabled="usbToAdd === undefined"
              :busy="busyId === 'add-usb'"
              @click="run('add-usb', () => createVmVusb(vm.id, usbToAdd!))"
            >
              {{ t('action:add') }}
            </UiButton>
          </template>
        </VmDeviceListCard>
      </VtsColumn>
    </VtsColumns>
  </div>
</template>

<script setup lang="ts">
import { useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import VmDeviceListCard from '@/modules/vm-device/components/VmDeviceListCard.vue'
import { useXoVmDevices } from '@/modules/vm-device/remote-resources/use-xo-vm-devices.ts'
import {
  attachVmPcis,
  createVmVgpu,
  createVmVtpm,
  createVmVusb,
  deleteVmVgpu,
  deleteVmVtpm,
  deleteVmVusb,
  detachVmPcis,
} from '@/modules/vm-device/utils/vm-device.api.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { ApiError } from '@/shared/error/api.error.ts'
import VtsColumn from '@core/components/column/VtsColumn.vue'
import VtsColumns from '@core/components/columns/VtsColumns.vue'
import VtsSelect from '@core/components/select/VtsSelect.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import { useTypeToConfirmModal } from '@core/composables/modals/use-type-to-confirm-modal.ts'
import { useFormSelect } from '@core/packages/form-select'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: FrontXoVm
}>()

const { t } = useI18n()

const { devices, areDevicesReady, reloadDevices } = useXoVmDevices({}, () => vm.id)
const { getHostById } = useXoHostCollection()

const isHalted = computed(() => vm.power_state === 'Halted')
const isUefi = computed(() => vm.boot.firmware === 'uefi')

const hostName = (hostId?: string) =>
  hostId === undefined ? undefined : (getHostById(hostId as Parameters<typeof getHostById>[0])?.name_label ?? hostId)

const pciItems = computed(() =>
  devices.value.pcis.map(pci => ({
    id: pci.pciId,
    label: pci.deviceName ?? pci.pciId,
    sublabel: [pci.pciId, hostName(pci.hostId)].filter(Boolean).join(' · '),
  }))
)

const vgpuItems = computed(() =>
  devices.value.vgpus.map(vgpu => ({
    id: vgpu.id,
    label: vgpu.vgpuType?.name ?? vgpu.id,
    sublabel: vgpu.gpuGroup?.name,
  }))
)

const vtpmItems = computed(() => devices.value.vtpms.map(id => ({ id, label: t('vtpm'), sublabel: id })))

const usbItems = computed(() =>
  devices.value.vusbs.map(vusb => ({
    id: vusb.id,
    label: vusb.description ?? vusb.id,
    sublabel: vusb.currentlyAttached ? t('status:connected') : t('status:disconnected'),
  }))
)

// PCI

const pciToAttach = ref<string>()

const attachablePcis = computed(() =>
  devices.value.availablePcis.filter(pci => !devices.value.pcis.some(attached => attached.pciId === pci.pciId))
)

const { id: pciSelectId } = useFormSelect(attachablePcis, {
  model: pciToAttach,
  searchable: true,
  placeholder: () => t('vm-devices:select-pci'),
  option: {
    id: pci => pci.id,
    value: pci => pci.id,
    label: pci => `${pci.deviceName} (${pci.pciId}, ${hostName(pci.hostId)})`,
  },
})

// vGPU

const vgpuChoices = computed(() =>
  devices.value.availableGpuGroups.flatMap(gpuGroup =>
    gpuGroup.vgpuTypes.map(vgpuType => ({
      id: `${gpuGroup.id}/${vgpuType.id}`,
      gpuGroupId: gpuGroup.id,
      vgpuTypeId: vgpuType.id,
      label: `${vgpuType.name} (${gpuGroup.name})`,
    }))
  )
)

const vgpuChoice = ref<string>()

const { id: vgpuTypeSelectId } = useFormSelect(vgpuChoices, {
  model: vgpuChoice,
  searchable: true,
  placeholder: () => t('vm-devices:select-vgpu-type'),
  option: { value: 'id' },
})

function addVgpu() {
  const choice = vgpuChoices.value.find(candidate => candidate.id === vgpuChoice.value)
  if (choice !== undefined) {
    return run('add-vgpu', () => createVmVgpu(vm.id, choice.gpuGroupId, choice.vgpuTypeId))
  }
}

// USB

const usbToAdd = ref<string>()

const addableUsbs = computed(() =>
  devices.value.availableUsbs.filter(usb => !devices.value.vusbs.some(vusb => vusb.usbGroupId === usb.usbGroupId))
)

const { id: usbSelectId } = useFormSelect(addableUsbs, {
  model: usbToAdd,
  searchable: true,
  placeholder: () => t('vm-devices:select-usb'),
  option: {
    id: usb => usb.usbGroupId,
    value: usb => usb.usbGroupId,
    label: usb => `${usb.description} (${hostName(usb.hostId)})`,
  },
})

// vTPM

const { open: openTypeToConfirmModal } = useTypeToConfirmModal()

function confirmDeleteVtpm(vtpmId: string) {
  return openTypeToConfirmModal({
    props: {
      accent: 'danger',
      icon: 'status:danger-picto',
      title: t('modal:delete-vtpm-title', { name: vm.name_label }),
      description: t('modal:delete-vtpm-description'),
      confirmationText: vm.name_label,
      confirmLabel: t('action:delete'),
    },
    events: {
      onConfirm: () => run(vtpmId, () => deleteVmVtpm(vm.id, vtpmId)),
    },
  })
}

// actions

const busyId = ref<string>()
const actionError = ref<string>()

async function run(id: string, action: () => Promise<unknown>) {
  busyId.value = id
  actionError.value = undefined

  try {
    await action()
    pciToAttach.value = undefined
    vgpuChoice.value = undefined
    usbToAdd.value = undefined
    await reloadDevices()
  } catch (error) {
    const cause = error instanceof ApiError ? error.cause?.error : undefined
    actionError.value = typeof cause === 'string' ? cause : error instanceof Error ? error.message : String(error)
  } finally {
    busyId.value = undefined
  }
}
</script>

<style scoped lang="postcss">
.vm-devices {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  padding: 0.8rem;
}
</style>
