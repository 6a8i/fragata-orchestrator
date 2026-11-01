<template>
  <VtsContentSidePanel class="storage">
    <UiCard class="container">
      <StorageRepositoriesTable :srs :scope :busy="!areSrsReady" :error="hasSrFetchError">
        <template #title-actions>
          <UiButton variant="primary" accent="brand" size="medium" left-icon="fa:plus" @click="openNewSrDrawer(pool.id)">
            {{ t('new') }}
          </UiButton>
        </template>
      </StorageRepositoriesTable>
    </UiCard>
    <StorageRepositorySidePanel :sr="selectedSr" :scope @close="selectedSr = undefined" />
  </VtsContentSidePanel>
</template>

<script setup lang="ts">
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import StorageRepositorySidePanel from '@/modules/storage-repository/components/list/panel/StorageRepositorySidePanel.vue'
import StorageRepositoriesTable from '@/modules/storage-repository/components/list/StorageRepositoriesTable.vue'
import {
  useXoSrCollection,
  type FrontXoSr,
} from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import VtsContentSidePanel from '@core/components/layout/VtsContentSidePanel.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import { useNewSrDrawer } from '@/modules/storage-repository/composables/use-new-sr-drawer.composable.ts'
import { useI18n } from 'vue-i18n'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { SR_SCOPE_TYPE, type SrScope } from '@core/types/storage-repository.type.ts'
import { computed } from 'vue'

const { pool } = defineProps<{
  pool: FrontXoPool
}>()

const { t } = useI18n()

const { openNewSrDrawer } = useNewSrDrawer()

const { srsByPool, hasSrFetchError, getSrById, areSrsReady } = useXoSrCollection()

const srs = computed(() => srsByPool.value.get(pool.id) ?? [])

const scope: SrScope = { type: SR_SCOPE_TYPE.POOL }

const selectedSr = useRouteQuery<FrontXoSr | undefined>('id', {
  toData: id => getSrById(id as FrontXoSr['id']),
  toQuery: sr => sr?.id ?? '',
})
</script>

<style scoped lang="postcss">
.storage {
  .container {
    height: fit-content;
    margin: 0.8rem;
    gap: 4rem;
  }
}
</style>
