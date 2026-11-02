import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { expandAddresses } from './ip-pool.helper.mjs'

describe('expandAddresses', () => {
  it('keeps single addresses and removes duplicates', () => {
    assert.deepEqual(expandAddresses(['10.0.0.1', ' 10.0.0.1 ', '', 'fe80::1']), ['10.0.0.1', 'fe80::1'])
  })

  it('expands IPv4 ranges, across octets', () => {
    assert.deepEqual(expandAddresses(['10.0.0.254-10.0.1.1']), ['10.0.0.254', '10.0.0.255', '10.0.1.0', '10.0.1.1'])
  })

  it('rejects invalid or reversed ranges', () => {
    assert.throws(() => expandAddresses(['10.0.0.5-10.0.0.1']))
    assert.throws(() => expandAddresses(['10.0.0.1-10.0.300.1']))
    assert.throws(() => expandAddresses(['10.0.0.1-10.0.0.2-10.0.0.3']))
  })

  it('rejects ranges larger than 65536 addresses', () => {
    assert.throws(() => expandAddresses(['10.0.0.0-10.1.0.0']))
  })
})
