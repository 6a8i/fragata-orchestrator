export type HostBlockDevice = {
  /** kernel name, e.g. `sdb` */
  name: string
  /** device path, e.g. `/dev/sdb` */
  path: string
  /** `disk`, `part`, `lvm`, `raid1`, `rom`... as reported by `lsblk` */
  type: string
  /** in bytes */
  size: number
  /** empty when the device is not mounted */
  mountpoint: string
  readOnly: boolean
  /** partitions, LVM volumes, RAID arrays... built on this device */
  children: HostBlockDevice[]
}

type RawBlockDevice = {
  name?: unknown
  kname?: unknown
  type?: unknown
  size?: unknown
  mountpoint?: unknown
  ro?: unknown
  children?: unknown
}

function normalizeBlockDevice(raw: RawBlockDevice): HostBlockDevice {
  const name = String(raw.name ?? raw.kname ?? '')
  return {
    name,
    path: name.startsWith('/') ? name : `/dev/${name}`,
    type: String(raw.type ?? ''),
    size: Number(raw.size ?? 0),
    // lsblk prints an empty or null mountpoint for unmounted devices
    mountpoint: typeof raw.mountpoint === 'string' ? raw.mountpoint : '',
    readOnly: raw.ro === '1' || raw.ro === 1 || raw.ro === true,
    children: Array.isArray(raw.children)
      ? raw.children.map(child => normalizeBlockDevice(child as RawBlockDevice))
      : [],
  }
}

/**
 * Normalizes the output of the `list_block_devices` function of the host `lsblk.py` plugin (`{ blockdevices: [...] }`,
 * `lsblk` fields as strings)
 */
export function parseBlockDevices(output: string): HostBlockDevice[] {
  const parsed = JSON.parse(output) as { blockdevices?: unknown }
  const devices = Array.isArray(parsed?.blockdevices) ? parsed.blockdevices : []
  return devices.map(device => normalizeBlockDevice(device as RawBlockDevice))
}
