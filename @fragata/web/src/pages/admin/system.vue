<template>
  <UiHeadBar icon="fa:gear">{{ t('system') }}</UiHeadBar>
  <VtsColumns extra-space-around>
    <VtsColumn>
      <ConfigBackupCard />
    </VtsColumn>
    <VtsColumn>
      <ApiLogsCard />
    </VtsColumn>
  </VtsColumns>
</template>

<script setup lang="ts">
import ApiLogsCard from '@/modules/system/components/ApiLogsCard.vue'
import ConfigBackupCard from '@/modules/system/components/ConfigBackupCard.vue'
import VtsColumn from '@core/components/column/VtsColumn.vue'
import VtsColumns from '@core/components/columns/VtsColumns.vue'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>
