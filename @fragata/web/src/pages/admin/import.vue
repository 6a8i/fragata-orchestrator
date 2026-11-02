<template>
  <UiHeadBar icon="fa:download">{{ t('import') }}</UiHeadBar>
  <VtsColumns extra-space-around>
    <VtsColumn>
      <EsxiImportCard />
    </VtsColumn>
    <VtsColumn>
      <FileImportCard />
    </VtsColumn>
  </VtsColumns>
</template>

<script setup lang="ts">
import EsxiImportCard from '@/modules/import/components/EsxiImportCard.vue'
import FileImportCard from '@/modules/import/components/FileImportCard.vue'
import VtsColumn from '@core/components/column/VtsColumn.vue'
import VtsColumns from '@core/components/columns/VtsColumns.vue'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>
