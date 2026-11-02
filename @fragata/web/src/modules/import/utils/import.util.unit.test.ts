import { baseName, diskFormatFromName } from '@/modules/import/utils/import.util.ts'
import { describe, expect, it } from 'vitest'

describe('diskFormatFromName', () => {
  it('reads the extension', () => {
    expect(diskFormatFromName('disk.vhd')).toBe('vhd')
    expect(diskFormatFromName('DISK.VHD')).toBe('vhd')
    expect(diskFormatFromName('debian.iso')).toBe('raw')
    expect(diskFormatFromName('disk.img')).toBe('raw')
    expect(diskFormatFromName('disk.raw')).toBe('raw')
    expect(diskFormatFromName('disk.vmdk')).toBeUndefined()
    expect(diskFormatFromName('disk')).toBeUndefined()
  })
})

describe('baseName', () => {
  it('drops the extension only', () => {
    expect(baseName('debian-12.iso')).toBe('debian-12')
    expect(baseName('a.b.vhd')).toBe('a.b')
    expect(baseName('.hidden')).toBe('.hidden')
    expect(baseName('disk')).toBe('disk')
  })
})
