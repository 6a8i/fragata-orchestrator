<template>
  <UiCard>
    <UiTitle>{{ t('xostor:health') }}</UiTitle>
    <p class="description">{{ t('xostor:health-description') }}</p>
    <UiAlert v-if="error !== undefined" accent="danger">{{ error }}</UiAlert>
    <div>
      <UiButton accent="brand" variant="secondary" size="medium" :busy="isChecking" @click="check()">
        {{ t('action:run-health-check') }}
      </UiButton>
    </div>
    <pre v-if="health !== undefined" class="health typo-body-regular-small">{{ health }}</pre>
  </UiCard>
</template>

<script setup lang="ts">
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { toErrorMessage } from '@/modules/system/utils/system.util.ts'
import { fetchGet } from '@/shared/utils/fetch.util.ts'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { sr } = defineProps<{
  sr: FrontXoSr
}>()

const { t } = useI18n()

const health = ref<string>()
const error = ref<string>()
const isChecking = ref(false)

watch(
  () => sr.id,
  () => {
    health.value = undefined
    error.value = undefined
  }
)

async function check() {
  isChecking.value = true
  error.value = undefined
  try {
    health.value = JSON.stringify(await fetchGet(`srs/${sr.id}/xostor_health`), null, 2)
  } catch (cause) {
    error.value = toErrorMessage(cause)
  } finally {
    isChecking.value = false
  }
}
</script>

<style scoped lang="postcss">
.description {
  color: var(--color-neutral-txt-secondary);
}

.health {
  max-height: 40rem;
  overflow: auto;
  padding: 0.8rem;
  background-color: var(--color-neutral-background-secondary);
}
</style>
