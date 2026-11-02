<template>
  <UiTitle>
    {{ t('groups') }}
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
      <VtsRow v-for="group of paginatedGroups" :key="group.id" :selected="selectedGroupId === group.id">
        <BodyCells :item="group" />
      </VtsRow>
    </tbody>
  </VtsTable>
</template>

<script setup lang="ts">
import type { FrontXoGroup } from '@/modules/group/remote-ressources/use-xo-group-collection.ts'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useTableState } from '@core/composables/table-state.composable.ts'
import { useGroupColumns } from '@core/tables/column-sets/group-columns.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { groups, busy } = defineProps<{
  groups: FrontXoGroup[]
  busy?: boolean
}>()

defineSlots<{
  'title-actions'(): any
}>()

const { t } = useI18n()

const selectedGroupId = useRouteQuery('id')

const sortedGroups = computed(() => [...groups].sort((a, b) => a.name.localeCompare(b.name)))

const { pageRecords: paginatedGroups, paginationBindings } = usePagination('groups', sortedGroups)

const state = useTableState({
  busy: () => busy,
  empty: () => (groups.length === 0 ? t('no-group-available') : false),
})

const { HeadCells, BodyCells } = useGroupColumns({
  body: (group: FrontXoGroup) => ({
    name: r => r(group.name),
    members: r => r(t('n-users', { n: group.users.length })),
    roles: r => r(t('n-roles', { n: group.aclRoleIds.length })),
    selectItem: r => r(() => (selectedGroupId.value = group.id)),
  }),
})
</script>
