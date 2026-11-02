<template>
  <UiTitle>
    {{ t('resource-sets') }}
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
      <VtsRow v-for="set of paginatedSets" :key="set.id" :selected="selectedSetId === set.id">
        <BodyCells :item="set" />
      </VtsRow>
    </tbody>
  </VtsTable>
</template>

<script setup lang="ts">
import type { FrontXoResourceSet } from '@/modules/resource-set/remote-resources/use-xo-resource-set-collection.ts'
import { formatGib, formatUsage } from '@/modules/resource-set/utils/resource-set.util.ts'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useTableState } from '@core/composables/table-state.composable.ts'
import { useResourceSetColumns } from '@core/tables/column-sets/resource-set-columns.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { resourceSets, busy, error } = defineProps<{
  resourceSets: FrontXoResourceSet[]
  busy?: boolean
  error?: boolean
}>()

defineSlots<{
  'title-actions'(): any
}>()

const { t } = useI18n()

const selectedSetId = useRouteQuery('id')

const { pageRecords: paginatedSets, paginationBindings } = usePagination(
  'resource-sets',
  computed(() => resourceSets)
)

const state = useTableState({
  busy: () => busy,
  error: () => error,
  empty: () => (resourceSets.length === 0 ? t('no-resource-set') : false),
})

const unlimited = () => t('resource-set:unlimited')

const { HeadCells, BodyCells } = useResourceSetColumns({
  body: (set: FrontXoResourceSet) => ({
    name: r => r(set.name),
    subjects: r => r(String(set.subjects.length)),
    objects: r => r(String(set.objects.length)),
    cpus: r => r(formatUsage(set.limits.cpus) ?? unlimited()),
    memory: r => r(formatUsage(set.limits.memory, formatGib) ?? unlimited()),
    disk: r => r(formatUsage(set.limits.disk, formatGib) ?? unlimited()),
    selectItem: r => r(() => (selectedSetId.value = set.id)),
  }),
})
</script>
