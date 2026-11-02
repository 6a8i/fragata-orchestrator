<template>
  <UiCard>
    <div class="header">
      <UiTitle>{{ t('api-logs') }}</UiTitle>
      <UiButton
        accent="danger"
        variant="secondary"
        size="small"
        left-icon="fa:trash"
        :disabled="logs.length === 0"
        :busy="busyId === 'all'"
        @click="clearAll()"
      >
        {{ t('action:clear-all') }}
      </UiButton>
    </div>
    <p class="description">{{ t('api-logs:description') }}</p>
    <UiAlert v-if="actionError !== undefined" accent="danger">{{ actionError }}</UiAlert>

    <div v-for="log of logs" :key="log.id" class="log">
      <div class="log-header">
        <span class="method typo-body-bold">{{ log.method ?? log.message }}</span>
        <span class="sublabel typo-body-regular-small">{{ new Date(log.time).toLocaleString() }}</span>
        <span v-if="log.userId !== undefined" class="sublabel typo-body-regular-small">
          {{ userLabel(log.userId) }}
        </span>
        <UiButtonIcon
          v-tooltip="t('action:delete')"
          icon="fa:trash"
          accent="brand"
          size="small"
          :disabled="busyId !== undefined"
          @click="deleteLog(log.id)"
        />
      </div>
      <div v-if="apiLogErrorMessage(log.error) !== undefined" class="error typo-body-regular-small">
        {{ apiLogErrorMessage(log.error) }}
      </div>
    </div>
    <VtsStateHero v-if="logs.length === 0" type="no-data" format="card" horizontal size="extra-small">
      {{ t('api-logs:none') }}
    </VtsStateHero>
  </UiCard>
</template>

<script setup lang="ts">
import { apiLogErrorMessage, toErrorMessage } from '@/modules/system/utils/system.util.ts'
import { useXoUserCollection } from '@/modules/user/remote-resources/use-xo-user-collection.ts'
import { fetchDelete, fetchGet } from '@/shared/utils/fetch.util.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

type ApiLog = { id: string; time: number; message: string; method?: string; userId?: string; error?: unknown }

const LIMIT = 100

const { t } = useI18n()

const { users } = useXoUserCollection()

const logs = ref<ApiLog[]>([])
const busyId = ref<string>()
const actionError = ref<string>()

function userLabel(userId: string) {
  const user = users.value.find(candidate => candidate.id === userId)
  return user?.name ?? user?.email ?? userId
}

async function load() {
  try {
    logs.value = await fetchGet<ApiLog[]>(`api-logs?limit=${LIMIT}`)
  } catch (error) {
    actionError.value = toErrorMessage(error)
  }
}

onMounted(load)

async function run(id: string, action: () => Promise<unknown>) {
  busyId.value = id
  actionError.value = undefined
  try {
    await action()
    await load()
  } catch (error) {
    actionError.value = toErrorMessage(error)
  } finally {
    busyId.value = undefined
  }
}

function deleteLog(id: string) {
  return run(id, () => fetchDelete(`api-logs/${id}`))
}

function clearAll() {
  return run('all', () => fetchDelete('api-logs'))
}
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

.log {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding-block: 0.8rem;
  border-block-end: 0.1rem solid var(--color-neutral-border);

  .log-header {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.4rem 0.8rem;

    .method {
      flex: 1 1 100%;
      overflow-wrap: anywhere;
    }
  }

  .error {
    color: var(--color-danger-txt-base);
    overflow-wrap: anywhere;
  }
}
</style>
