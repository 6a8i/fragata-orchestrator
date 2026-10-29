<template>
  <div class="host-pif-table">
    <UiTitle>
      {{ t('pifs') }}
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
          <VtsRow v-for="pif of paginatedPifs" :key="pif.uuid" :selected="selectedPifId === pif.uuid">
            <BodyCells :item="pif" />
          </VtsRow>
        </tbody>
      </VtsTable>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { XenApiNetwork, XenApiPif } from '@/libs/xen-api/xen-api.types.ts'
import { usePifForget } from '@/modules/pif/composables/use-pif-forget.composable.ts'
import { useNetworkStore } from '@/stores/xen-api/network.store.ts'
import { usePifStore } from '@/stores/xen-api/pif.store.ts'
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
import { usePifColumns } from '@core/tables/column-sets/pif-columns.ts'
import { useNumberSchema } from '@core/utils/query-builder/use-number-schema.ts'
import { useStringSchema } from '@core/utils/query-builder/use-string-schema.ts'
import { IP_CONFIGURATION_MODE } from '@vates/types'
import { logicNot } from '@vueuse/math'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

type PifStatus = ReturnType<typeof getPifStatus>

type FilterablePif = XenApiPif & {
  network_name: string
  status: PifStatus
  ip_addresses: string[]
}

const { pifs } = defineProps<{
  pifs: XenApiPif[]
}>()

defineSlots<{
  'title-actions'(): any
}>()

const { isReady, hasError } = usePifStore().subscribe()
const { getByOpaqueRef } = useNetworkStore().subscribe()
const { getPifStatus } = usePifStore().subscribe()

const { t } = useI18n()

const selectedPifId = useRouteQuery('id')

const getNetworkName = (networkRef: XenApiNetwork['$ref']) => getByOpaqueRef(networkRef)?.name_label ?? ''

const getVlanData = (vlan: number) => (vlan !== -1 ? vlan : t('none'))

const getIpAddresses = (pif: XenApiPif) => [pif.IP, ...pif.IPv6].filter(ip => ip)

const getIpConfigurationMode = (ipMode: string) => {
  switch (ipMode) {
    case 'Static':
      return t('static')
    case 'DHCP':
      return t('dhcp')
    default:
      return t('none')
  }
}

// network name, status and IP addresses are not plain fields of the XAPI PIF record
// (they come from the network, the PIF metrics or several fields), so they are added to make them filterable
const filterablePifs = computed(() =>
  pifs.map(
    pif =>
      ({
        ...pif,
        network_name: getNetworkName(pif.network),
        status: getPifStatus(pif),
        ip_addresses: getIpAddresses(pif),
      }) satisfies FilterablePif
  )
)

const { items: filteredPifs, filter } = useQueryBuilderFilter('pif', filterablePifs)

const schema = useQueryBuilderSchema<FilterablePif>({
  '': useStringSchema(t('any-property')),
  network_name: useStringSchema(t('network')),
  device: useStringSchema(t('device')),
  status: useStringSchema(t('status'), {
    connected: t('connected'),
    disconnected: t('disconnected'),
    'disconnected-from-physical-device': t('disconnected-from-physical-device'),
  } satisfies Record<PifStatus, string>),
  VLAN: useNumberSchema(t('vlan')),
  ip_addresses: useStringSchema(t('ip-address')),
  MAC: useStringSchema(t('mac-address')),
  ip_configuration_mode: useStringSchema(t('mode'), {
    [IP_CONFIGURATION_MODE.STATIC]: t('static'),
    [IP_CONFIGURATION_MODE.DHCP]: t('dhcp'),
    [IP_CONFIGURATION_MODE.NONE]: t('none'),
  } satisfies Record<IP_CONFIGURATION_MODE, string>),
})

const state = useTableState({
  busy: logicNot(isReady),
  error: hasError,
  empty: () =>
    pifs.length === 0 ? t('no-pif-detected') : filteredPifs.value.length === 0 ? { type: 'no-result' } : false,
})

const { pageRecords: paginatedPifs, paginationBindings } = usePagination('pifs', filteredPifs)

function getManagementIcon(pif: XenApiPif) {
  if (!pif.management) {
    return undefined
  }

  return {
    icon: icon('status:primary-circle'),
    tooltip: t('management'),
  }
}

const { HeadCells, BodyCells } = usePifColumns({
  exclude: ['selectItem'],
  body: (pif: XenApiPif) => {
    const name = computed(() => getNetworkName(pif.network))
    const status = computed(() => getPifStatus(pif))
    const vlan = computed(() => getVlanData(pif.VLAN))
    const ipAddresses = computed(() => getIpAddresses(pif))
    const ipMode = computed(() => getIpConfigurationMode(pif.ip_configuration_mode))
    const rightIcon = computed(() => getManagementIcon(pif))

    const { forgetPifs, canForgetPifs, isForgettingPifs, forgetPifsErrorMessage } = usePifForget(() => [pif])

    return {
      network: r => r({ label: name.value }),
      device: r => r(pif.device, { rightIcon: rightIcon.value }),
      status: r => r(status.value),
      vlan: r => r(vlan.value),
      ip: r => r(ipAddresses.value),
      mac: r => r(pif.MAC),
      mode: r => r(ipMode.value),
      actions: r =>
        r({
          onClick: () => (selectedPifId.value = pif.uuid),
          actions: [
            {
              label: t('action:forget'),
              icon: 'action:forget',
              onClick: () => forgetPifs(),
              busy: isForgettingPifs.value,
              disabled: !canForgetPifs.value,
              hint: forgetPifsErrorMessage.value,
              accent: 'danger',
            },
          ],
        }),
    }
  },
})
</script>

<style scoped lang="postcss">
.host-pif-table,
.container {
  display: flex;
  flex-direction: column;
}

.host-pif-table {
  gap: 2.4rem;

  .container {
    gap: 0.8rem;
  }
}
</style>
