import {
  idsOfPattern,
  idsPattern,
  type OtherBackupJobForm,
  retentionOf,
  toCreateBody,
  toUpdateBody,
} from '@/modules/backup-job/utils/other-backup-job.util.ts'
import { describe, expect, it } from 'vitest'

const form: OtherBackupJobForm = {
  name: 'nightly',
  remoteIds: ['r1', 'r2'],
  retention: 5,
  cron: '0 1 * * *',
  poolIds: ['p1'],
  xoMetadata: true,
  mode: 'delta',
  sourceRemoteId: 'r0',
}

describe('idsPattern / idsOfPattern', () => {
  it('round-trips', () => {
    expect(idsOfPattern(idsPattern(['a', 'b']))).toEqual(['a', 'b'])
    expect(idsOfPattern({ id: 'a' })).toEqual(['a'])
    expect(idsOfPattern(undefined)).toEqual([])
  })
})

describe('toCreateBody', () => {
  it('builds a metadata job with one schedule', () => {
    expect(toCreateBody('metadata', form)).toEqual({
      name: 'nightly',
      remotes: { id: { __or: ['r1', 'r2'] } },
      settings: { '': {}, schedule: { retentionXoMetadata: 5, retentionPoolMetadata: 5 } },
      schedules: { schedule: { cron: '0 1 * * *', enabled: true, name: 'nightly' } },
      xoMetadata: true,
      pools: { id: { __or: ['p1'] } },
    })
  })

  it('builds a mirror job', () => {
    const body = toCreateBody('mirror', form)
    expect(body).toMatchObject({ mode: 'delta', sourceRemote: 'r0', settings: { schedule: { exportRetention: 5 } } })
  })
})

describe('toUpdateBody', () => {
  it('sets the retention of every schedule and keeps their other settings', () => {
    const body = toUpdateBody('mirror', form, { '': { a: 1 }, s1: { exportRetention: 2, b: 2 }, s2: {} })
    expect(body.settings).toEqual({ '': { a: 1 }, s1: { b: 2, exportRetention: 5 }, s2: { exportRetention: 5 } })
  })

  it('removes the pools when none is selected', () => {
    expect(toUpdateBody('metadata', { ...form, poolIds: [] }, {})).toMatchObject({ pools: null })
  })
})

describe('retentionOf', () => {
  it('reads the first schedule', () => {
    expect(retentionOf('mirror', { '': {}, s: { exportRetention: 3 } })).toBe(3)
    expect(retentionOf('metadata', { s: { retentionPoolMetadata: 4 } })).toBe(4)
    expect(retentionOf('metadata', {})).toBe(7)
  })
})
