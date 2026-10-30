<template>
  <UiCard class="vm-snapshot-card">
    <UiCardTitle>{{ title }}</UiCardTitle>
    <VtsKeyValueList>
      <VtsKeyValueRow :label="t('snapshot')" :copy-value="snapshot?.name_label">
        <template #value>
          <UiLink
            v-if="snapshot?.name_label"
            icon="object:vm-snapshot"
            size="medium"
            :to="{ name: '/vm/[id]/snapshots', params: { id: snapshot.$snapshot_of }, query: { id: snapshot.id } }"
          >
            {{ snapshot.name_label }}
          </UiLink>
        </template>
      </VtsKeyValueRow>
      <VtsKeyValueRow :label="t('snapshot-created-on')">
        <template #value>
          <span v-if="formattedDate">{{ formattedDate }}</span>
        </template>
      </VtsKeyValueRow>
    </VtsKeyValueList>
  </UiCard>
</template>

<script setup lang="ts">
import type { FrontXoVmSnapshot } from '@/modules/snapshot/components/remote-resources/use-xo-vm-snapshot-collection.ts'
import VtsKeyValueList from '@core/components/key-value-list/VtsKeyValueList.vue'
import VtsKeyValueRow from '@core/components/key-value-row/VtsKeyValueRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { formatDateTime } from '@core/utils/time.util.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { snapshot } = defineProps<{
  snapshot: FrontXoVmSnapshot | undefined
  title: string
}>()

const { t } = useI18n()

const formattedDate = computed(() => (snapshot ? formatDateTime(snapshot.snapshot_time * 1000) : undefined))
</script>
