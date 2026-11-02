import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import { computed } from 'vue'

/** Shape returned by `GET /resource-sets` */
export type FrontXoResourceSet = {
  id: string
  name: string
  subjects: string[]
  objects: string[]
  ipPools: string[]
  /** `cpus`, `memory`, `disk` or `ipPool:<id>` → quota and usage */
  limits: Record<string, { total?: number; usage: number }>
  shareByDefault: boolean
  tags: string[]
}

export const useXoResourceSetCollection = defineRemoteResource({
  url: `${BASE_URL}/resource-sets`,
  initialData: () => [] as FrontXoResourceSet[],
  state: (resourceSets, context) => {
    const sortedResourceSets = computed(() => [...resourceSets.value].sort((a, b) => a.name.localeCompare(b.name)))

    return {
      resourceSets: sortedResourceSets,
      getResourceSetById: (id: string) => resourceSets.value.find(set => set.id === id),
      areResourceSetsReady: context.isReady,
      hasResourceSetFetchError: context.hasError,
      reloadResourceSets: context.forceReload,
    }
  },
})
