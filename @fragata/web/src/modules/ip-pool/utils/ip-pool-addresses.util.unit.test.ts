import { collapseAddresses, parseAddressEntries } from '@/modules/ip-pool/utils/ip-pool-addresses.util.ts'
import { describe, expect, it } from 'vitest'

describe('collapseAddresses', () => {
  it('collapses consecutive IPv4 addresses into ranges', () => {
    expect(collapseAddresses(['10.0.0.3', '10.0.0.1', '10.0.0.2', '10.0.0.10'])).toEqual(['10.0.0.1-10.0.0.3', '10.0.0.10'])
  })

  it('crosses octet boundaries', () => {
    expect(collapseAddresses(['10.0.0.255', '10.0.1.0'])).toEqual(['10.0.0.255-10.0.1.0'])
  })

  it('keeps IPv6 addresses after the IPv4 ones', () => {
    expect(collapseAddresses(['fe80::1', '10.0.0.1'])).toEqual(['10.0.0.1', 'fe80::1'])
  })

  it('returns nothing for no address', () => {
    expect(collapseAddresses([])).toEqual([])
  })
})

describe('parseAddressEntries', () => {
  it('splits on lines and commas and drops blanks', () => {
    expect(parseAddressEntries('10.0.0.1-10.0.0.5\n 10.0.0.9 ,\n\nfe80::1')).toEqual([
      '10.0.0.1-10.0.0.5',
      '10.0.0.9',
      'fe80::1',
    ])
  })
})
