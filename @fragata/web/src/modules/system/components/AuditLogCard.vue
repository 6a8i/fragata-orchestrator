<template>
  <UiCard>
    <div class="header">
      <UiTitle>{{ t('audit') }}</UiTitle>
      <UiButton accent="brand" variant="secondary" size="small" :busy="isLoading" @click="load()">
        {{ t('action:refresh') }}
      </UiButton>
    </div>
    <p class="description">{{ t('audit:description') }}</p>
    <UiInput v-model.trim="filter" accent="brand" :placeholder="t('audit:filter-placeholder')" @keyup.enter="load()" />
    <UiAlert v-if="error !== undefined" accent="warning">{{ error }}</UiAlert>

    <div v-for="record of records" :key="record.id" class="record">
      <span class="what typo-body-bold">{{ record.data?.method ?? record.event }}</span>
      <span class="sublabel typo-body-regular-small">
        {{
          [new Date(record.time).toLocaleString(), record.subject?.userName, record.subject?.userIp]
            .filter(Boolean)
            .join(' · ')
        }}
      </span>
    </div>
    <VtsStateHero
      v-if="records.length === 0 && error === undefined"
      type="no-data"
      format="card"
      horizontal
      size="extra-small"
    >
      {{ t('audit:none') }}
    </VtsStateHero>
  </UiCard>
</template>

<script setup lang="ts">
import { toErrorMessage } from '@/modules/system/utils/system.util.ts'
import { ApiError } from '@/shared/error/api.error.ts'
import { fetchGet } from '@/shared/utils/fetch.util.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiInput from '@core/components/ui/input/UiInput.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

type AuditRecord = {
  id: string
  event: string
  time: number
  data?: { method?: string }
  subject?: { userName?: string; userIp?: string }
}

const LIMIT = 100

const { t } = useI18n()

const records = ref<AuditRecord[]>([])
const filter = ref('')
const isLoading = ref(false)
const error = ref<string>()

async function load() {
  isLoading.value = true
  error.value = undefined
  try {
    const query = new URLSearchParams({ fields: '*', limit: String(LIMIT) })
    if (filter.value !== '') {
      query.set('filter', filter.value)
    }
    records.value = await fetchGet<AuditRecord[]>(`plugins/audit/records?${query}`)
  } catch (cause) {
    records.value = []
    // the routes exist only while the audit plugin is loaded
    error.value =
      cause instanceof ApiError && cause.status === 404 ? t('audit:plugin-not-loaded') : toErrorMessage(cause)
  } finally {
    isLoading.value = false
  }
}

onMounted(load)
</script>

<style scoped lang="postcss">
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.description,
.sublabel {
  color: var(--color-neutral-txt-secondary);
}

.record {
  display: flex;
  flex-direction: column;
  padding-block: 0.6rem;
  border-block-end: 0.1rem solid var(--color-neutral-border);

  .what {
    overflow-wrap: anywhere;
  }
}
</style>
