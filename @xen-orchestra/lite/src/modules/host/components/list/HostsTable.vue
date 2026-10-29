<template>
  <div class="hosts-table">
    <UiTitle>
      {{ t('hosts') }}
    </UiTitle>
    <VtsQueryBuilder v-model="filter" :schema />
    <div class="container">
      <VtsTable :pagination-bindings :state sticky="right">
        <thead>
          <tr>
            <HeadCells />
          </tr>
        </thead>
        <tbody>
          <VtsRow v-for="host of paginatedHosts" :key="host.$ref" :selected="selectedHostId === host.uuid">
            <BodyCells :item="host" />
          </VtsRow>
        </tbody>
      </VtsTable>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { XenApiHost } from '@/libs/xen-api/xen-api.types.ts'
import { getHostIcon } from '@/modules/host/utils/host.util.ts'
import { getHostIpAddresses } from '@/modules/pif/utils/pif.util.ts'
import { useHostMetricsStore } from '@/stores/xen-api/host-metrics.store.ts'
import { usePifStore } from '@/stores/xen-api/pif.store.ts'
import { usePoolStore } from '@/stores/xen-api/pool.store.ts'
import VtsQueryBuilder from '@core/components/query-builder/VtsQueryBuilder.vue'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useTableState } from '@core/composables/table-state.composable.ts'
import { icon } from '@core/icons'
import { useQueryBuilderSchema } from '@core/packages/query-builder/schema/use-query-builder-schema.ts'
import { useQueryBuilderFilter } from '@core/packages/query-builder/use-query-builder-filter.ts'
import { useHostColumns } from '@core/tables/column-sets/host-columns.ts'
import { useStringSchema } from '@core/utils/query-builder/use-string-schema.ts'
import { HOST_POWER_STATE } from '@vates/types'
import { logicAnd, logicNot, logicOr } from '@vueuse/math'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

type FilterableHost = XenApiHost & { power_state: HOST_POWER_STATE }

const {
  hosts: rawHosts,
  busy,
  error,
} = defineProps<{
  hosts: XenApiHost[]
  busy?: boolean
  error?: boolean
}>()

const { t } = useI18n()

const { getHostPowerState } = useHostMetricsStore().subscribe()
const { isMasterHost } = usePoolStore().subscribe()
const { pifsByHost, isReady: arePifsReady, hasError: hasPifError } = usePifStore().subscribe()

const isReady = logicAnd(() => !busy, arePifsReady)

const hasError = logicOr(() => error, hasPifError)

const selectedHostId = useRouteQuery('id')

// power_state is not on the XAPI host record (it comes from host_metrics), so it is added to make it filterable
const filterableHosts = computed(() =>
  rawHosts.map(host => ({ ...host, power_state: getHostPowerState(host) }) satisfies FilterableHost)
)

const { items: filteredHosts, filter } = useQueryBuilderFilter('host', filterableHosts)

const schema = useQueryBuilderSchema<FilterableHost>({
  '': useStringSchema(t('any-property')),
  name_label: useStringSchema(t('name')),
  name_description: useStringSchema(t('description')),
  address: useStringSchema(t('ip-address')),
  power_state: useStringSchema(t('power-state'), {
    [HOST_POWER_STATE.RUNNING]: t('status:running'),
    [HOST_POWER_STATE.HALTED]: t('status:halted'),
    [HOST_POWER_STATE.UNKNOWN]: t('status:unknown'),
  } satisfies Record<HOST_POWER_STATE, string>),
  tags: useStringSchema(t('tags')),
})

const state = useTableState({
  busy: logicNot(isReady),
  error: hasError,
  empty: () => {
    if (rawHosts.length === 0) {
      return t('no-host-detected')
    }

    if (filteredHosts.value.length === 0) {
      return { type: 'no-result' }
    }

    return false
  },
})

const { pageRecords: paginatedHosts, paginationBindings } = usePagination('hosts', filteredHosts)

function getMasterIcon(host: XenApiHost) {
  if (!isMasterHost(host.$ref)) {
    return undefined
  }

  return {
    icon: icon('status:primary-circle'),
    tooltip: t('master'),
  }
}

const { HeadCells, BodyCells } = useHostColumns({
  exclude: ['checkbox', 'srStatus'],
  body: (host: XenApiHost) => {
    const ipAddresses = computed(() => getHostIpAddresses(host.address, pifsByHost.value.get(host.$ref)))
    const hostIcon = computed(() => getHostIcon(host, getHostPowerState(host)))
    const rightIcon = computed(() => getMasterIcon(host))

    return {
      host: r =>
        r({
          label: host.name_label,
          to: { name: '/host/[uuid]/dashboard', params: { uuid: host.uuid } },
          icon: hostIcon.value,
          rightIcon: rightIcon.value,
        }),
      description: r => r(host.name_description),
      ipAddresses: r => r(ipAddresses.value),
      tags: r => r(host.tags),
      selectItem: r => r(() => (selectedHostId.value = host.uuid)),
    }
  },
})
</script>

<style lang="postcss" scoped>
.hosts-table {
  display: flex;
  flex-direction: column;
  gap: 2.4rem;

  .container {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }
}
</style>
