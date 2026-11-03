<template>
  <UiCard>
    <UiTitle>
      {{ t('local') }}
    </UiTitle>
    <VtsTabularKeyValueList>
      <VtsTabularKeyValueRow :label="t('path')" :value="file.path" />
    </VtsTabularKeyValueList>
  </UiCard>
</template>

<script setup lang="ts">
import VtsTabularKeyValueList from '@core/components/tabular-key-value-list/VtsTabularKeyValueList.vue'
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import type { ParsedFileBackupRepositoryUrl } from 'fragata-remote-parser'
import { useI18n } from 'vue-i18n'

defineProps<{
  file: ParsedFileBackupRepositoryUrl
}>()

const { t } = useI18n()
</script>
