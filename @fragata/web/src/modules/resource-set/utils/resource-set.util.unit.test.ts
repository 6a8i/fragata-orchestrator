import { formatGib, formatUsage, toLimits, toQuotas } from '@/modules/resource-set/utils/resource-set.util.ts'
import { describe, expect, it } from 'vitest'

const GIB = 1024 ** 3

describe('toQuotas', () => {
  it('reads the totals, in GiB for memory and disk', () => {
    expect(toQuotas({ cpus: { total: 8, usage: 2 }, memory: { total: 16 * GIB, usage: 0 } })).toEqual({
      cpus: 8,
      memoryGib: 16,
      diskGib: '',
    })
  })

  it('treats a limit without total as no quota', () => {
    expect(toQuotas({ cpus: { usage: 4 } }).cpus).toBe('')
  })
})

describe('toLimits', () => {
  it('drops empty quotas and keeps IP pool quotas', () => {
    expect(
      toLimits({ cpus: 4, memoryGib: '', diskGib: 1.5 }, { 'ipPool:abc': { total: 3, usage: 1 }, memory: { total: 1, usage: 0 } })
    ).toEqual({ 'ipPool:abc': 3, cpus: 4, disk: 1.5 * GIB })
  })
})

describe('formatUsage', () => {
  it('formats usage over total', () => {
    expect(formatUsage({ total: 8, usage: 3 })).toBe('3 / 8')
    expect(formatUsage({ total: 2 * GIB, usage: GIB }, formatGib)).toBe('1 GiB / 2 GiB')
  })

  it('returns nothing without quota', () => {
    expect(formatUsage(undefined)).toBeUndefined()
    expect(formatUsage({ usage: 1 })).toBeUndefined()
  })
})
