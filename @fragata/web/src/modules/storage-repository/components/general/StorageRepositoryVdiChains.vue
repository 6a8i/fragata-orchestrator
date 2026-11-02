<template>
  <UiCard>
    <UiTitle>{{ t('vdi-chains') }}</UiTitle>
    <p class="description">{{ t('vdi-chains:description') }}</p>
    <UiAlert v-if="error !== undefined" accent="danger">{{ error }}</UiAlert>
    <template v-else-if="chains !== undefined">
      <UiInfo :accent="unhealthy.length === 0 ? 'success' : 'warning'">
        {{ unhealthy.length === 0 ? t('vdi-chains:healthy') : t('vdi-chains:n-to-coalesce', { n: unhealthy.length }) }}
      </UiInfo>
      <div v-for="[uuid, length] of unhealthy" :key="uuid" class="row">
        <span class="label">{{ vdiName(uuid) }}</span>
        <span class="sublabel typo-body-regular-small">{{ t('vdi-chains:n-parents', { n: length }) }}</span>
      </div>
      <div v-for="[uuid, parent] of missingParents" :key="uuid" class="row">
        <span class="label">{{ vdiName(uuid) }}</span>
        <UiInfo accent="danger">{{ t('vdi-chains:missing-parent', { parent }) }}</UiInfo>
      </div>
    </template>
    <div>
      <UiButton accent="brand" variant="secondary" size="small" :busy="isLoading" @click="load()">
        {{ t('action:refresh') }}
      </UiButton>
    </div>
  </UiCard>
</template>

<script setup lang="ts">
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { toErrorMessage } from '@/modules/system/utils/system.util.ts'
import { useXoVdiCollection } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import { fetchGet } from '@/shared/utils/fetch.util.ts'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

type VdiChains = {
  unhealthyVdis: Record<string, number>
  vdisWithUnknownVhdParent: Record<string, string>
}

const { sr } = defineProps<{
  sr: FrontXoSr
}>()

const { t } = useI18n()

const { vdis } = useXoVdiCollection()

const chains = ref<VdiChains>()
const isLoading = ref(false)
const error = ref<string>()

const unhealthy = computed(() => Object.entries(chains.value?.unhealthyVdis ?? {}))
const missingParents = computed(() => Object.entries(chains.value?.vdisWithUnknownVhdParent ?? {}))

const vdiName = (uuid: string) => vdis.value.find(vdi => vdi.uuid === uuid)?.name_label ?? uuid

async function load() {
  isLoading.value = true
  error.value = undefined
  try {
    chains.value = await fetchGet<VdiChains>(`srs/${sr.id}/vdi_chains`)
  } catch (cause) {
    error.value = toErrorMessage(cause)
  } finally {
    isLoading.value = false
  }
}

onMounted(load)
watch(() => sr.id, load)
</script>

<style scoped lang="postcss">
.description,
.sublabel {
  color: var(--color-neutral-txt-secondary);
}

.row {
  display: flex;
  align-items: center;
  gap: 0.8rem;

  .label {
    flex: 1;
    overflow-wrap: anywhere;
  }
}
</style>
