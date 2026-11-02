import { fetchDelete, fetchPost } from '@/shared/utils/fetch.util.ts'

export function attachVmPcis(vmId: string, pciIds: string[]) {
  return fetchPost<void>(`vms/${vmId}/actions/attach_pcis`, { pciIds })
}

export function detachVmPcis(vmId: string, pciAddresses: string[]) {
  return fetchPost<void>(`vms/${vmId}/actions/detach_pcis`, { pciAddresses })
}

export function createVmVgpu(vmId: string, gpuGroupId: string, vgpuTypeId: string) {
  return fetchPost<{ id: string }>(`vms/${vmId}/vgpus`, { gpuGroupId, vgpuTypeId })
}

export function deleteVmVgpu(vmId: string, vgpuId: string) {
  return fetchDelete(`vms/${vmId}/vgpus/${vgpuId}`)
}

export function createVmVtpm(vmId: string) {
  return fetchPost<{ id: string }>(`vms/${vmId}/vtpms`)
}

export function deleteVmVtpm(vmId: string, vtpmId: string) {
  return fetchDelete(`vms/${vmId}/vtpms/${vtpmId}`)
}

export function createVmVusb(vmId: string, usbGroupId: string) {
  return fetchPost<{ id: string }>(`vms/${vmId}/vusbs`, { usbGroupId })
}

export function deleteVmVusb(vmId: string, vusbId: string) {
  return fetchDelete(`vms/${vmId}/vusbs/${vusbId}`)
}
