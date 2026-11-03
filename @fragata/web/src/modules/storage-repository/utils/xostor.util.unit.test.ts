import {
  getXostorUsableSize,
  type HostBlockDevice,
  isXostorCompatibleDisk,
} from '@/modules/storage-repository/utils/xostor.util.ts'

function device(patch: Partial<HostBlockDevice> = {}): HostBlockDevice {
  return {
    name: 'sdb',
    path: '/dev/sdb',
    type: 'disk',
    size: 100,
    mountpoint: '',
    readOnly: false,
    children: [],
    ...patch,
  }
}

describe('isXostorCompatibleDisk', () => {
  it('accepts a blank writable disk or RAID array', () => {
    expect(isXostorCompatibleDisk(device())).toBe(true)
    expect(isXostorCompatibleDisk(device({ type: 'raid1', name: 'md0', path: '/dev/md0' }))).toBe(true)
  })

  it('rejects partitioned, mounted, read-only, tapdisk and non-disk devices', () => {
    expect(isXostorCompatibleDisk(device({ children: [device({ name: 'sdb1', type: 'part' })] }))).toBe(false)
    expect(isXostorCompatibleDisk(device({ mountpoint: '/mnt' }))).toBe(false)
    expect(isXostorCompatibleDisk(device({ readOnly: true }))).toBe(false)
    expect(isXostorCompatibleDisk(device({ name: 'tda', path: '/dev/tda' }))).toBe(false)
    expect(isXostorCompatibleDisk(device({ type: 'rom', name: 'sr0' }))).toBe(false)
    expect(isXostorCompatibleDisk(device({ type: 'part', name: 'sda1' }))).toBe(false)
  })
})

describe('getXostorUsableSize', () => {
  it('uses the smallest host for every host, divided by the replication', () => {
    expect(getXostorUsableSize([100, 200, 300], 2)).toBe(150)
    expect(getXostorUsableSize([100, 0, 300], 1)).toBe(200)
  })

  it('is 0 without disks', () => {
    expect(getXostorUsableSize([], 2)).toBe(0)
    expect(getXostorUsableSize([0, 0], 2)).toBe(0)
  })
})
