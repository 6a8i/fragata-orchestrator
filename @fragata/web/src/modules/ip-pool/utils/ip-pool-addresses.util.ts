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

/**
 * Collapses consecutive IPv4 addresses into `a.b.c.d-a.b.c.e` ranges, the format the REST API accepts back.
 * Other addresses (IPv6) are listed as is, after the IPv4 ones.
 */
export function collapseAddresses(addresses: string[]): string[] {
  const ipv4 = [
    ...new Set(addresses.map(ipv4ToNumber).filter((n): n is number => n !== undefined)),
  ].sort((a, b) => a - b)
  const others = addresses.filter(address => ipv4ToNumber(address) === undefined)

  const entries: string[] = []
  let start: number | undefined
  let previous: number | undefined

  const flush = () => {
    if (start === undefined || previous === undefined) {
      return
    }
    entries.push(start === previous ? numberToIpv4(start) : `${numberToIpv4(start)}-${numberToIpv4(previous)}`)
  }

  for (const n of ipv4) {
    if (previous !== undefined && n === previous + 1) {
      previous = n
      continue
    }
    flush()
    start = n
    previous = n
  }
  flush()

  return [...entries, ...others]
}

/** One entry per line or comma separated */
export function parseAddressEntries(text: string): string[] {
  return text
    .split(/[\n,]/)
    .map(entry => entry.trim())
    .filter(entry => entry !== '')
}
