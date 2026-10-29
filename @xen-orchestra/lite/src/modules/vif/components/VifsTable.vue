<template>
  <div class="vifs-table">
    <UiTitle>
      {{ t('vifs') }}
      <template #action>
        <slot name="title-actions" />
      </template>
    </UiTitle>
    <VtsQueryBuilder v-model="filter" :schema />
    <VtsTable :state :pagination-bindings sticky="right">
      <thead>
        <tr>
          <HeadCells />
        </tr>
      </thead>
      <tbody>
        <VtsRow v-for="vif of paginatedVifs" :key="vif.uuid" :selected="selectedVifId === vif.uuid">
          <BodyCells :item="vif" />
        </VtsRow>
      </tbody>
    </VtsTable>
  </div>
</template>

<script lang="ts" setup>
import type { XenApiNetwork, XenApiVif, XenApiVm } from '@/libs/xen-api/xen-api.types.ts'
import { useVifConnection } from '@/modules/vif/composables/use-vif-connection.composable.ts'
import { useNetworkStore } from '@/stores/xen-api/network.store.ts'
import { useVifStore } from '@/stores/xen-api/vif.store.ts'
import { useVmGuestMetricsStore } from '@/stores/xen-api/vm-guest-metrics.store.ts'
import VtsQueryBuilder from '@core/components/query-builder/VtsQueryBuilder.vue'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useTableState } from '@core/composables/table-state.composable.ts'
import { useMapper } from '@core/packages/mapper'
import { useQueryBuilderSchema } from '@core/packages/query-builder/schema/use-query-builder-schema.ts'
import { useQueryBuilderFilter } from '@core/packages/query-builder/use-query-builder-filter.ts'
import { type ActionItem } from '@core/tables/column-definitions/action-column.ts'
import { useVifColumns } from '@core/tables/column-sets/vif-columns.ts'
import { CONNECTION_ACTION } from '@core/types/connection.ts'
import { getUniqueIpAddressesForDevice } from '@core/utils/ip-address.utils.ts'
import { useBooleanSchema } from '@core/utils/query-builder/use-boolean-schema.ts'
import { useNumberSchema } from '@core/utils/query-builder/use-number-schema.ts'
import { useStringSchema } from '@core/utils/query-builder/use-string-schema.ts'
import { VIF_LOCKING_MODE } from '@vates/types'
import { logicNot } from '@vueuse/math'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

type FilterableVif = XenApiVif & {
  network_name: string
  ip_addresses: string[]
  device_label: string
}

const { vifs, vm } = defineProps<{
  vifs: XenApiVif[]
  vm: XenApiVm
}>()

defineSlots<{
  'title-actions'(): any
}>()

const { isReady, hasError } = useVifStore().subscribe()
const { getByOpaqueRef: getNetworkByOpaqueRef } = useNetworkStore().subscribe()
const { getByOpaqueRef: getGuestMetricsByOpaqueRef } = useVmGuestMetricsStore().subscribe()

const { t } = useI18n()

const selectedVifId = useRouteQuery('id')

const getNetworkName = (networkRef: XenApiNetwork['$ref']) => getNetworkByOpaqueRef(networkRef)?.name_label ?? ''

const getIpAddresses = (vif: XenApiVif) => {
  const networks = getGuestMetricsByOpaqueRef(vm.guest_metrics)?.networks

  return getUniqueIpAddressesForDevice(networks, vif.device)
}

const getDeviceLabel = (vif: XenApiVif) => t('vif-device', { device: vif.device })

// network name and IP addresses are not fields of the XAPI VIF record (they come from the network and the VM guest
// metrics), and the device is displayed with a label ("VIF #0"), so they are added to make them filterable as displayed
const filterableVifs = computed(() =>
  vifs.map(
    vif =>
      ({
        ...vif,
        network_name: getNetworkName(vif.network),
        ip_addresses: getIpAddresses(vif),
        device_label: getDeviceLabel(vif),
      }) satisfies FilterableVif
  )
)

const { items: filteredVifs, filter } = useQueryBuilderFilter('vif', filterableVifs)

const schema = useQueryBuilderSchema<FilterableVif>({
  '': useStringSchema(t('any-property')),
  network_name: useStringSchema(t('network')),
  device_label: useStringSchema(t('device')),
  currently_attached: useBooleanSchema(t('status'), {
    true: t('connected'),
    false: t('disconnected'),
  }),
  ip_addresses: useStringSchema(t('ip-addresses')),
  MAC: useStringSchema(t('mac-addresses')),
  MTU: useNumberSchema(t('mtu')),
  locking_mode: useStringSchema(t('locking-mode'), {
    [VIF_LOCKING_MODE.NETWORK_DEFAULT]: t('network-default'),
    [VIF_LOCKING_MODE.LOCKED]: t('locked'),
    [VIF_LOCKING_MODE.UNLOCKED]: t('unlocked'),
    [VIF_LOCKING_MODE.DISABLED]: t('disabled'),
  } satisfies Record<VIF_LOCKING_MODE, string>),
})

const state = useTableState({
  busy: logicNot(isReady),
  error: hasError,
  empty: () =>
    vifs.length === 0 ? t('no-vif-detected') : filteredVifs.value.length === 0 ? { type: 'no-result' } : false,
})

const { pageRecords: paginatedVifs, paginationBindings } = usePagination('vifs', filteredVifs)

const { HeadCells, BodyCells } = useVifColumns({
  body: (vif: XenApiVif) => {
    const name = computed(() => getNetworkName(vif.network))
    const ipAddresses = computed(() => getIpAddresses(vif))

    const {
      connectVifs,
      disconnectVifs,
      canConnectVifs,
      canDisconnectVifs,
      isConnectingVifs,
      isDisconnectingVifs,
      connectVifsErrorMessage,
      disconnectVifsErrorMessage,
    } = useVifConnection({
      vifs: () => [vif],
      vm: () => vm,
    })

    const connectionAction = useMapper(
      () => (vif.currently_attached ? CONNECTION_ACTION.DISCONNECT : CONNECTION_ACTION.CONNECT),
      () => ({
        connect: {
          label: t('action:connect'),
          icon: 'action:connect',
          onClick: () => connectVifs(),
          disabled: !canConnectVifs.value,
          busy: isConnectingVifs.value,
          hint: canConnectVifs.value ? undefined : connectVifsErrorMessage.value,
        } satisfies ActionItem,
        disconnect: {
          label: t('action:disconnect'),
          icon: 'action:disconnect',
          onClick: () => disconnectVifs(),
          disabled: !canDisconnectVifs.value,
          busy: isDisconnectingVifs.value,
          hint: canDisconnectVifs.value ? undefined : disconnectVifsErrorMessage.value,
        } satisfies ActionItem,
      }),
      'connect'
    )

    return {
      network: r => r({ label: name.value }),
      device: r => r(getDeviceLabel(vif)),
      status: r => r(vif.currently_attached ? 'connected' : 'disconnected'),
      ipsAddresses: r => r(ipAddresses.value),
      macAddresses: r => r(vif.MAC),
      mtu: r => r(vif.MTU),
      lockingMode: r => r(vif.locking_mode),
      actions: r =>
        r({
          onClick: () => (selectedVifId.value = vif.uuid),
          actions: [connectionAction.value],
        }),
    }
  },
})
</script>

<style scoped lang="postcss">
.vifs-table {
  display: flex;
  flex-direction: column;
  gap: 2.4rem;
}
</style>
