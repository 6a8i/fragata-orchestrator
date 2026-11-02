import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import { computed } from 'vue'

/** Shape returned by `GET /ip-pools` */
export type FrontXoIpPool = {
  id: string
  name: string
  addresses: string[]
  allocatedAddresses: string[]
  networks: string[]
}

export const useXoIpPoolCollection = defineRemoteResource({
  url: `${BASE_URL}/ip-pools`,
  initialData: () => [] as FrontXoIpPool[],
  state: (ipPools, context) => {
    const sortedIpPools = computed(() => [...ipPools.value].sort((a, b) => a.name.localeCompare(b.name)))

    return {
      ipPools: sortedIpPools,
      getIpPoolById: (id: string) => ipPools.value.find(ipPool => ipPool.id === id),
      areIpPoolsReady: context.isReady,
      hasIpPoolFetchError: context.hasError,
      reloadIpPools: context.forceReload,
    }
  },
})
