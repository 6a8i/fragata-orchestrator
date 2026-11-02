import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'

/** Shape returned by `GET /vms/{id}/devices` */
export type VmDevices = {
  pcis: { id?: string; pciId: string; className?: string; deviceName?: string; hostId?: string }[]
  vgpus: {
    id: string
    device: string
    currentlyAttached: boolean
    gpuGroup?: { id: string; name: string }
    vgpuType?: { id: string; name: string }
  }[]
  vtpms: string[]
  vusbs: { id: string; currentlyAttached: boolean; usbGroupId?: string; description?: string }[]
  availablePcis: { id: string; pciId: string; className: string; deviceName: string; hostId: string }[]
  availableGpuGroups: { id: string; name: string; vgpuTypes: { id: string; name: string }[] }[]
  availableUsbs: { usbGroupId: string; description: string; hostId: string }[]
}

const EMPTY_DEVICES: VmDevices = {
  pcis: [],
  vgpus: [],
  vtpms: [],
  vusbs: [],
  availablePcis: [],
  availableGpuGroups: [],
  availableUsbs: [],
}

export const useXoVmDevices = defineRemoteResource({
  url: (vmId: string) => `${BASE_URL}/vms/${vmId}/devices`,
  initialData: () => EMPTY_DEVICES,
  state: (devices, context) => ({
    devices,
    areDevicesReady: context.isReady,
    hasDevicesFetchError: context.hasError,
    reloadDevices: context.forceReload,
  }),
})
