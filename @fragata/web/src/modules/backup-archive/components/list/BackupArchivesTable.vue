<template>
  <UiTitle>
    {{ t('backup-archives') }}
  </UiTitle>
  <VtsQueryBuilder :model-value="filter" :schema @search="filter = $event" />

  <VtsTable :state :pagination-bindings sticky="right">
    <thead>
      <tr>
        <HeadCells />
      </tr>
    </thead>
    <tbody>
      <VtsRow
        v-for="backupArchive of paginatedBackupArchives"
        :key="backupArchive.id"
        :selected="selectedBackupArchiveId === backupArchive.id"
      >
        <BodyCells :item="backupArchive" />
      </VtsRow>
    </tbody>
  </VtsTable>
</template>

<script setup lang="ts">
import { useXoBackupRepositoryCollection } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import type { FrontXoVmBackupArchive } from '@/modules/vm/remote-resources/use-xo-vm-backup-archive-collection.ts'
import VtsQueryBuilder from '@core/components/query-builder/VtsQueryBuilder.vue'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useTableState } from '@core/composables/table-state.composable.ts'
import { useQueryBuilderSchema } from '@core/packages/query-builder/schema/use-query-builder-schema.ts'
import { useQueryBuilderFilter } from '@core/packages/query-builder/use-query-builder-filter.ts'
import { useBackupArchiveListColumns } from '@core/tables/column-sets/backup-archive-list-columns.ts'
import { useStringSchema } from '@core/utils/query-builder/use-string-schema.ts'
import { formatSizeRaw } from '@core/utils/size.util.ts'
import { useI18n } from 'vue-i18n'

const { backupArchives, busy, error } = defineProps<{
  backupArchives: FrontXoVmBackupArchive[]
  busy: boolean
  error: boolean
}>()

const { t } = useI18n()

const { getBackupRepositoryById } = useXoBackupRepositoryCollection()

// the archives arrive in listing order: show the most recent first
const sortedBackupArchives = () => [...backupArchives].sort((a, b) => b.timestamp - a.timestamp)

const { items: filteredBackupArchives, filter } = useQueryBuilderFilter('backup-archives', sortedBackupArchives)

const schema = useQueryBuilderSchema<FrontXoVmBackupArchive>({
  '': useStringSchema(t('any-property')),
})

const selectedBackupArchiveId = useRouteQuery('id')

const { pageRecords: paginatedBackupArchives, paginationBindings } = usePagination(
  'backup-archives',
  filteredBackupArchives
)

const state = useTableState({
  busy: () => busy,
  error: () => error,
  empty: () =>
    backupArchives.length === 0
      ? t('no-backup-archive-available')
      : filteredBackupArchives.value.length === 0
        ? { type: 'no-result' }
        : false,
})

const { HeadCells, BodyCells } = useBackupArchiveListColumns({
  body: (backupArchive: FrontXoVmBackupArchive) => {
    const br = getBackupRepositoryById(backupArchive.backupRepository)
    const size = formatSizeRaw(backupArchive.size, 1)

    return {
      vm: r => r({ label: backupArchive.vm.name_label, icon: 'object:vm' }),
      date: r => r(backupArchive.timestamp),
      mode: r => r(backupArchive.mode === 'delta' ? t('incremental') : t('full')),
      backupRepository: r =>
        br !== undefined
          ? r({
              label: br.name,
              to: { name: '/admin/backup-repository/[id]/general', params: { id: br.id } },
              icon: br.enabled ? 'object:br:connected' : 'object:br:disconnected',
            })
          : r({ label: backupArchive.backupRepository, icon: 'object:br:disconnected' }),
      sizeOnDisk: r => r(size.value, size.prefix),
      selectItem: r => r(() => (selectedBackupArchiveId.value = backupArchive.id)),
    }
  },
})
</script>
