import type { FrontXoResourceSet } from '@/modules/resource-set/remote-resources/use-xo-resource-set-collection.ts'

const GIB = 1024 ** 3

/** Quotas as the form edits them: vCPUs, and memory and disk in GiB; `''` means no quota */
export type ResourceSetQuotas = {
  cpus: number | ''
  memoryGib: number | ''
  diskGib: number | ''
}

export function toQuotas(limits: FrontXoResourceSet['limits']): ResourceSetQuotas {
  const total = (key: string) => limits[key]?.total
  const cpus = total('cpus')
  const memory = total('memory')
  const disk = total('disk')

  return {
    cpus: cpus ?? '',
    memoryGib: memory === undefined ? '' : Math.round((memory / GIB) * 100) / 100,
    diskGib: disk === undefined ? '' : Math.round((disk / GIB) * 100) / 100,
  }
}

/**
 * Builds the `limits` body: quotas left empty are dropped, the IP pool quotas of the set are kept as they are.
 */
export function toLimits(quotas: ResourceSetQuotas, previous: FrontXoResourceSet['limits'] = {}): Record<string, number> {
  const limits: Record<string, number> = {}

  for (const [key, limit] of Object.entries(previous)) {
    if (key.startsWith('ipPool:') && limit.total !== undefined) {
      limits[key] = limit.total
    }
  }

  if (quotas.cpus !== '') limits.cpus = Number(quotas.cpus)
  if (quotas.memoryGib !== '') limits.memory = Math.round(Number(quotas.memoryGib) * GIB)
  if (quotas.diskGib !== '') limits.disk = Math.round(Number(quotas.diskGib) * GIB)

  return limits
}

/** `usage / total` of a quota, `undefined` when the set has none */
export function formatUsage(
  limit: { total?: number; usage: number } | undefined,
  format: (value: number) => string = String
): string | undefined {
  if (limit?.total === undefined) {
    return undefined
  }
  return `${format(limit.usage)} / ${format(limit.total)}`
}

export function formatGib(bytes: number): string {
  return `${Math.round((bytes / GIB) * 10) / 10} GiB`
}
