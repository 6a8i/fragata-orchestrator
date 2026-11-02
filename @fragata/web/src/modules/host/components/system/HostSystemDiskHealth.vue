<template>
  <UiCard>
    <UiTitle>
      {{ t('disk-health') }}
    </UiTitle>
    <VtsStateHero v-if="!isReady" format="card" type="busy" size="small" />
    <VtsTabularKeyValueList v-else>
      <VtsTabularKeyValueRow :label="t('raid-status')">
        <template #value>
          <UiInfo :accent="raid.accent">{{ raid.label }}</UiInfo>
        </template>
      </VtsTabularKeyValueRow>
      <VtsTabularKeyValueRow v-if="smartctlHealth === null" :label="t('smart-status')">
        <template #value>
          <UiInfo accent="info">{{ t('disk-health:smartctl-plugin-missing') }}</UiInfo>
        </template>
      </VtsTabularKeyValueRow>
      <VtsTabularKeyValueRow v-else-if="disks.length === 0" :label="t('smart-status')">
        <template #value>
          <UiInfo accent="info">{{ t('disk-health:no-disk') }}</UiInfo>
        </template>
      </VtsTabularKeyValueRow>
      <VtsTabularKeyValueRow v-for="disk of disks" v-else :key="disk.device" :label="disk.device">
        <template #value>
          <UiInfo :accent="disk.healthy ? 'success' : 'danger'">{{ disk.status }}</UiInfo>
        </template>
      </VtsTabularKeyValueRow>
    </VtsTabularKeyValueList>
  </UiCard>
</template>

<script setup lang="ts">
import { useXoHostMdadmHealth, useXoHostSmartctlHealth } from '@/modules/host/remote-resources/use-xo-host-disk-health.ts'
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import VtsTabularKeyValueList from '@core/components/tabular-key-value-list/VtsTabularKeyValueList.vue'
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { logicAnd } from '@vueuse/math'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { host } = defineProps<{
  host: FrontXoHost
}>()

const { t } = useI18n()

const { smartctlHealth, isSmartctlHealthReady } = useXoHostSmartctlHealth({}, () => host.id)
const { mdadmHealth, isMdadmHealthReady } = useXoHostMdadmHealth({}, () => host.id)

const isReady = logicAnd(isSmartctlHealthReady, isMdadmHealthReady)

const disks = computed(() =>
  Object.entries(smartctlHealth.value ?? {}).map(([device, status]) => ({
    device,
    status,
    healthy: status.toUpperCase() === 'PASSED' || status.toUpperCase() === 'OK',
  }))
)

const raid = computed<{ label: string; accent: 'success' | 'warning' | 'info' }>(() => {
  if (mdadmHealth.value === null) {
    return { label: t('disk-health:raid-plugin-missing'), accent: 'info' }
  }

  const state = mdadmHealth.value.raid?.State
  if (state === undefined) {
    return { label: t('disk-health:no-raid'), accent: 'info' }
  }

  return ['clean', 'active'].includes(state)
    ? { label: t('disk-health:raid-healthy'), accent: 'success' }
    : { label: t('disk-health:raid-state', { state }), accent: 'warning' }
})
</script>
