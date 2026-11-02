<template>
  <UiTitle>
    {{ t('ip-pools') }}
    <template #action>
      <slot name="title-actions" />
    </template>
  </UiTitle>

  <VtsTable :state :pagination-bindings sticky="right">
    <thead>
      <tr>
        <HeadCells />
      </tr>
    </thead>
    <tbody>
      <VtsRow v-for="ipPool of paginatedIpPools" :key="ipPool.id" :selected="selectedIpPoolId === ipPool.id">
        <BodyCells :item="ipPool" />
      </VtsRow>
    </tbody>
  </VtsTable>
</template>

<script setup lang="ts">
import type { FrontXoIpPool } from '@/modules/ip-pool/remote-resources/use-xo-ip-pool-collection.ts'
import { useXoNetworkCollection } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useTableState } from '@core/composables/table-state.composable.ts'
import { useIpPoolColumns } from '@core/tables/column-sets/ip-pool-columns.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { ipPools, busy, error } = defineProps<{
  ipPools: FrontXoIpPool[]
  busy?: boolean
  error?: boolean
}>()

defineSlots<{
  'title-actions'(): any
}>()

const { t } = useI18n()

const { getNetworkById } = useXoNetworkCollection()

const selectedIpPoolId = useRouteQuery('id')

const { pageRecords: paginatedIpPools, paginationBindings } = usePagination(
  'ip-pools',
  computed(() => ipPools)
)

const state = useTableState({
  busy: () => busy,
  error: () => error,
  empty: () => (ipPools.length === 0 ? t('no-ip-pool') : false),
})

const { HeadCells, BodyCells } = useIpPoolColumns({
  body: (ipPool: FrontXoIpPool) => ({
    name: r => r(ipPool.name),
    addresses: r => r(String(ipPool.addresses.length)),
    allocated: r => r(String(ipPool.allocatedAddresses.length)),
    networks: r =>
      r(
        ipPool.networks
          .map(id => getNetworkById(id as Parameters<typeof getNetworkById>[0])?.name_label ?? id)
          .join(', ')
      ),
    selectItem: r => r(() => (selectedIpPoolId.value = ipPool.id)),
  }),
})
</script>
