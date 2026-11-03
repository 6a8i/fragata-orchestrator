import { fetchGet } from '@/shared/utils/fetch.util.ts'

/** Item of `GET /hosts/{id}/block_devices` */
export type HostBlockDevice = {
  name: string
  path: string
  type: string
  size: number
  mountpoint: string
  readOnly: boolean
  children: HostBlockDevice[]
}

export type XostorProvisioning = 'thin' | 'thick'

export function getHostBlockDevices(hostId: string): Promise<HostBlockDevice[]> {
  return fetchGet<HostBlockDevice[]>(`hosts/${hostId}/block_devices`)
}

/**
 * Whether a disk can be given to XOSTOR, same rules as the former XOSTOR form: a whole disk or a RAID array, writable,
 * not mounted, without partitions or volumes on it, and not a tapdisk (`td*`) device.
 */
export function isXostorCompatibleDisk(device: HostBlockDevice): boolean {
  return (
    (device.type === 'disk' || device.type.startsWith('raid')) &&
    !device.readOnly &&
    device.mountpoint === '' &&
    device.children.length === 0 &&
    !device.name.startsWith('td')
  )
}

/**
 * Space usable by the VMs: LINSTOR keeps `replication` copies of each volume, and every host contributes as much as
 * the host with the least space (`sizeByHost` holds the total size of the selected disks of each host).
 */
export function getXostorUsableSize(sizeByHost: number[], replication: number): number {
  const sizes = sizeByHost.filter(size => size > 0)
  if (sizes.length === 0 || replication < 1) {
    return 0
  }
  return (Math.min(...sizes) * sizes.length) / replication
}
