import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'

/** Device path → SMART overall result (`PASSED`, `FAILED`, ...); `null` without the smartctl plugin */
export type HostSmartctlHealth = Record<string, string> | null

/** Output of the RAID plugin; `null` without it */
export type HostMdadmHealth = { raid?: { State?: string } & Record<string, unknown> } | null

export const useXoHostSmartctlHealth = defineRemoteResource({
  url: (hostId: string) => `${BASE_URL}/hosts/${hostId}/smartctl_health`,
  initialData: () => null as HostSmartctlHealth,
  state: (smartctlHealth, context) => ({
    smartctlHealth,
    isSmartctlHealthReady: context.isReady,
  }),
})

export const useXoHostMdadmHealth = defineRemoteResource({
  url: (hostId: string) => `${BASE_URL}/hosts/${hostId}/mdadm_health`,
  initialData: () => null as HostMdadmHealth,
  state: (mdadmHealth, context) => ({
    mdadmHealth,
    isMdadmHealthReady: context.isReady,
  }),
})
