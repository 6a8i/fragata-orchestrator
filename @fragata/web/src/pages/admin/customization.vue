<template>
  <UiHeadBar icon="fa:tags">{{ t('tags-and-templates') }}</UiHeadBar>
  <VtsColumns extra-space-around>
    <VtsColumn>
      <TagsCard />
    </VtsColumn>
    <VtsColumn>
      <CloudConfigsCard />
    </VtsColumn>
  </VtsColumns>
</template>

<script setup lang="ts">
import CloudConfigsCard from '@/modules/system/components/CloudConfigsCard.vue'
import TagsCard from '@/modules/system/components/TagsCard.vue'
import VtsColumn from '@core/components/column/VtsColumn.vue'
import VtsColumns from '@core/components/columns/VtsColumns.vue'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>
