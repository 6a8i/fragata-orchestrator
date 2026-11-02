export type VmDevicePci = {
  /** XO id of the PCI, when it can still be found on a host of the pool */
  id?: string
  /** PCI address, such as `0000:04:00.0` */
  pciId: string
  className?: string
  deviceName?: string
  hostId?: string
}

export type VmDeviceVgpu = {
  id: string
  device: string
  currentlyAttached: boolean
  gpuGroup?: { id: string; name: string }
  vgpuType?: { id: string; name: string }
}

export type VmDeviceVusb = {
  id: string
  currentlyAttached: boolean
  usbGroupId?: string
  description?: string
}

export type VmDevices = {
  pcis: VmDevicePci[]
  vgpus: VmDeviceVgpu[]
  vtpms: string[]
  vusbs: VmDeviceVusb[]
  /** PCIs of the hosts of the pool, that can be attached */
  availablePcis: Required<Pick<VmDevicePci, 'id' | 'pciId' | 'className' | 'deviceName' | 'hostId'>>[]
  /** GPU groups of the pool, with the vGPU types they can create */
  availableGpuGroups: { id: string; name: string; vgpuTypes: { id: string; name: string }[] }[]
  /** passthrough-enabled USB devices of the hosts of the pool */
  availableUsbs: { usbGroupId: string; description: string; hostId: string }[]
}

export type AttachVmPcisBody = {
  /** XO ids of the PCIs */
  pciIds: string[]
}

export type DetachVmPcisBody = {
  /** PCI addresses, as listed in `pcis[].pciId` */
  pciAddresses: string[]
}

export type CreateVmVgpuBody = {
  gpuGroupId: string
  vgpuTypeId: string
}

export type CreateVmVusbBody = {
  usbGroupId: string
}
