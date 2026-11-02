<template>
  <VtsColumns extra-space-around>
    <VtsColumn>
      <StorageRepositoryGeneralInformation :sr />
      <StorageRepositoryPbdDetails :sr />
      <StorageRepositoryVdiChains v-if="sr.content_type !== 'iso'" :sr />
    </VtsColumn>
    <VtsColumn>
      <StorageRepositorySpace :sr />
      <StorageRepositoryCustomFields :sr />
      <StorageRepositoryXostorHealth v-if="sr.SR_type === 'linstor'" :sr />
    </VtsColumn>
  </VtsColumns>
</template>

<script setup lang="ts">
import StorageRepositoryCustomFields from '@/modules/storage-repository/components/general/StorageRepositoryCustomFields.vue'
import StorageRepositoryGeneralInformation from '@/modules/storage-repository/components/general/StorageRepositoryGeneralInformation.vue'
import StorageRepositoryPbdDetails from '@/modules/storage-repository/components/general/StorageRepositoryPbdDetails.vue'
import StorageRepositorySpace from '@/modules/storage-repository/components/general/StorageRepositorySpace.vue'
import StorageRepositoryVdiChains from '@/modules/storage-repository/components/general/StorageRepositoryVdiChains.vue'
import StorageRepositoryXostorHealth from '@/modules/storage-repository/components/general/StorageRepositoryXostorHealth.vue'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import VtsColumn from '@core/components/column/VtsColumn.vue'
import VtsColumns from '@core/components/columns/VtsColumns.vue'

defineProps<{ sr: FrontXoSr }>()
</script>
