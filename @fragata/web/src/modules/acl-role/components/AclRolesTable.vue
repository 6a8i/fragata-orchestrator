<template>
  <UiTitle>{{ t('roles') }}</UiTitle>
  <UiAlert accent="info">{{ t('roles:templates-hint') }}</UiAlert>

  <VtsTable :state :pagination-bindings sticky="right">
    <thead>
      <tr>
        <HeadCells />
      </tr>
    </thead>
    <tbody>
      <VtsRow v-for="role of paginatedRoles" :key="role.id" :selected="selectedRoleId === role.id">
        <BodyCells :item="role" />
      </VtsRow>
    </tbody>
  </VtsTable>
</template>

<script setup lang="ts">
import type { FrontXoAclRole } from '@/modules/acl-role/remote-resources/use-xo-acl-role-collection.ts'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useTableState } from '@core/composables/table-state.composable.ts'
import { useAclRoleColumns } from '@core/tables/column-sets/group-columns.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { roles, busy } = defineProps<{
  roles: FrontXoAclRole[]
  busy?: boolean
}>()

const { t } = useI18n()

const selectedRoleId = useRouteQuery('id')

// regular roles first: they are the ones applied to users and groups
const sortedRoles = computed(() =>
  [...roles].sort(
    (a, b) => Number(a.isTemplate === true) - Number(b.isTemplate === true) || a.name.localeCompare(b.name)
  )
)

const { pageRecords: paginatedRoles, paginationBindings } = usePagination('acl-roles', sortedRoles)

const state = useTableState({
  busy: () => busy,
  empty: () => (roles.length === 0 ? t('no-role-available') : false),
})

const { HeadCells, BodyCells } = useAclRoleColumns({
  body: (role: FrontXoAclRole) => ({
    name: r => r(role.name),
    description: r => r(role.description ?? ''),
    kind: r => r(role.isTemplate ? t('roles:template') : t('roles:custom')),
    assignments: r =>
      r(
        role.isTemplate
          ? '—'
          : `${t('n-users', { n: role.userIds?.length ?? 0 })}, ${t('n-groups', { n: role.groupIds?.length ?? 0 })}`
      ),
    selectItem: r => r(() => (selectedRoleId.value = role.id)),
  }),
})
</script>
