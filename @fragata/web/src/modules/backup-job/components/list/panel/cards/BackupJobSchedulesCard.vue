<template>
  <UiPanelCard class="backup-job-schedules-card">
    <UiPanelCardTitle size="medium" :label="t('schedules')" :counter="schedules.length" />
    <div class="content">
      <template v-for="({ schedule, nextRun }, index) in schedulesWithNextRun" :key="schedule.id">
        <VtsDivider v-if="index > 0" class="divider" type="stretch" />
        <VtsCardRowKeyValue>
          <template #key>{{ t('name') }}</template>
          <template #value>
            <span class="schedule-name">
              <VtsIcon name="object:backup-schedule" size="medium" />
              {{ schedule.name || t('untitled') }}
            </span>
          </template>
          <template v-if="schedule.name" #addons>
            <VtsCopyButton :value="schedule.name" />
          </template>
        </VtsCardRowKeyValue>
        <VtsCardRowKeyValue>
          <template #key>{{ t('id') }}</template>
          <template #value>{{ schedule.id }}</template>
          <template #addons>
            <VtsCopyButton :value="schedule.id" />
          </template>
        </VtsCardRowKeyValue>
        <VtsCardRowKeyValue>
          <template #key>{{ t('status') }}</template>
          <template #value>
            <VtsStatus :status="schedule.enabled" />
          </template>
        </VtsCardRowKeyValue>
        <VtsCardRowKeyValue>
          <template #key>{{ t('cron-pattern') }}</template>
          <template #value>
            <span class="cron-pattern">{{ schedule.cron }}</span>
          </template>
          <template #addons>
            <VtsCopyButton :value="schedule.cron" />
          </template>
        </VtsCardRowKeyValue>
        <VtsCardRowKeyValue>
          <template #key>{{ t('next-run') }}</template>
          <template #value>{{ nextRun }}</template>
          <template v-if="nextRun !== undefined" #addons>
            <VtsCopyButton :value="nextRun" />
          </template>
        </VtsCardRowKeyValue>
      </template>
    </div>
  </UiPanelCard>
</template>

<script lang="ts" setup>
import type { FrontXoSchedule } from '@/modules/schedule/remote-resources/use-xo-schedule-collection.ts'
import { getScheduleNextRun } from '@/modules/schedule/utils/xo-schedule.util.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import VtsDivider from '@core/components/divider/VtsDivider.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import { formatDateTime } from '@core/utils/time.util.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { schedules } = defineProps<{
  schedules: FrontXoSchedule[]
}>()

const { t } = useI18n()

const schedulesWithNextRun = computed(() =>
  schedules.map(schedule => {
    const nextRun = getScheduleNextRun(schedule)

    return {
      schedule,
      nextRun: nextRun !== undefined ? formatDateTime(nextRun) : undefined,
    }
  })
)
</script>

<style scoped lang="postcss">
.backup-job-schedules-card {
  .content {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;

    .divider {
      margin-block: 1.6rem;
    }

    .schedule-name {
      display: flex;
      align-items: center;
      gap: 0.8rem;
    }

    .cron-pattern {
      overflow-wrap: anywhere;
    }
  }
}
</style>
