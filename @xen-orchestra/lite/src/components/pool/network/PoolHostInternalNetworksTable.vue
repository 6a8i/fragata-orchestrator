<template>
  <div class="pool-host-internal-networks-table">
    <UiTitle>
      {{ t('host-internal-networks') }}
      <template #action>
        <slot name="title-actions" />
      </template>
    </UiTitle>
    <div class="container">
      <VtsQueryBuilder v-model="filter" :schema />
      <VtsTable :state :pagination-bindings sticky="right">
        <thead>
          <tr>
            <HeadCells />
          </tr>
        </thead>
        <tbody>
          <VtsRow
            v-for="network of paginatedNetworks"
            :key="network.uuid"
            :selected="selectedNetworkId === network.uuid"
          >
            <BodyCells :item="network" />
          </VtsRow>
        </tbody>
      </VtsTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { XenApiNetwork } from '@/libs/xen-api/xen-api.types.ts'
import NetworkDeleteButton from '@/modules/network/components/actions/delete/NetworkDeleteButton.vue'
import { useNetworkStore } from '@/stores/xen-api/network.store.ts'
import VtsQueryBuilder from '@core/components/query-builder/VtsQueryBuilder.vue'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useTableState } from '@core/composables/table-state.composable.ts'
import { useQueryBuilderSchema } from '@core/packages/query-builder/schema/use-query-builder-schema.ts'
import { useQueryBuilderFilter } from '@core/packages/query-builder/use-query-builder-filter.ts'
import { useNetworkColumns } from '@core/tables/column-sets/network-columns.ts'
import { useNumberSchema } from '@core/utils/query-builder/use-number-schema.ts'
import { useStringSchema } from '@core/utils/query-builder/use-string-schema.ts'
import { NETWORK_DEFAULT_LOCKING_MODE } from '@vates/types'
import { logicNot } from '@vueuse/math'
import { useI18n } from 'vue-i18n'

const { networks } = defineProps<{
  networks: XenApiNetwork[]
}>()

defineSlots<{
  'title-actions'(): any
}>()

const { isReady, hasError } = useNetworkStore().subscribe()

const { t } = useI18n()

const selectedNetworkId = useRouteQuery('id')

const getLockingMode = (lockingMode: string) => (lockingMode === 'disabled' ? t('disabled') : t('unlocked'))

const { items: filteredNetworks, filter } = useQueryBuilderFilter('inw', () => networks)

const schema = useQueryBuilderSchema<XenApiNetwork>({
  '': useStringSchema(t('any-property')),
  name_label: useStringSchema(t('name')),
  name_description: useStringSchema(t('description')),
  MTU: useNumberSchema(t('mtu')),
  default_locking_mode: useStringSchema(t('default-locking-mode'), {
    [NETWORK_DEFAULT_LOCKING_MODE.DISABLED]: t('disabled'),
    [NETWORK_DEFAULT_LOCKING_MODE.UNLOCKED]: t('unlocked'),
  } satisfies Record<NETWORK_DEFAULT_LOCKING_MODE, string>),
})

const { pageRecords: paginatedNetworks, paginationBindings } = usePagination('internal-networks', filteredNetworks)

const state = useTableState({
  busy: logicNot(isReady),
  error: hasError,
  empty: () =>
    networks.length === 0
      ? t('no-network-detected')
      : filteredNetworks.value.length === 0
        ? { type: 'no-result' }
        : false,
})

const { HeadCells, BodyCells } = useNetworkColumns({
  exclude: ['status', 'vlan', 'selectItem'],
  body: (network: XenApiNetwork) => ({
    network: r => r({ label: network.name_label }),
    description: r => r(network.name_description),
    mtu: r => r(network.MTU),
    defaultLockingMode: r => r(getLockingMode(network.default_locking_mode)),
    actions: r =>
      r({
        onClick: () => (selectedNetworkId.value = network.uuid),
        component: NetworkDeleteButton,
        props: { network },
      }),
  }),
})
</script>

<style scoped lang="postcss">
.pool-host-internal-networks-table,
.container {
  display: flex;
  flex-direction: column;
  gap: 2.4rem;

  .container {
    gap: 0.8rem;
  }
}
</style>
