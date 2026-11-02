import { invalidParameters } from 'fragata-common/api-errors.js'

const MAX_RANGE_SIZE = 65536

function ipv4ToNumber(ip: string): number | undefined {
  const parts = ip.split('.')
  if (parts.length !== 4 || parts.some(part => !/^\d{1,3}$/.test(part) || Number(part) > 255)) {
    return undefined
  }
  return parts.reduce((acc, part) => acc * 256 + Number(part), 0)
}

function numberToIpv4(n: number): string {
  return [n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.')
}

/** Expands `a.b.c.d-a.b.c.e` IPv4 ranges; other entries (single IPv4 or IPv6 addresses) are kept as is */
export function expandAddresses(entries: string[]): string[] {
  const addresses = new Set<string>()
  for (const raw of entries) {
    const entry = raw.trim()
    if (entry === '') {
      continue
    }

    const [start, end, ...rest] = entry.split('-')
    if (end === undefined) {
      addresses.add(entry)
      continue
    }

    const from = ipv4ToNumber(start.trim())
    const to = ipv4ToNumber(end.trim())
    if (rest.length > 0 || from === undefined || to === undefined || from > to) {
      throw invalidParameters(`invalid IP range: ${entry}`)
    }
    if (to - from + 1 > MAX_RANGE_SIZE) {
      throw invalidParameters(`IP range too large (max ${MAX_RANGE_SIZE} addresses): ${entry}`)
    }
    for (let n = from; n <= to; n++) {
      addresses.add(numberToIpv4(n))
    }
  }
  return [...addresses]
}
