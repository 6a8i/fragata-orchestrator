<template>
  <UiCard>
    <UiTitle>{{ t('tags') }}</UiTitle>
    <p class="description">{{ t('tags:description') }}</p>
    <UiAlert v-if="actionError !== undefined" accent="danger">{{ actionError }}</UiAlert>

    <div v-for="tag of tags" :key="tag.id" class="row">
      <input
        class="color"
        type="color"
        :value="tag.color ?? DEFAULT_COLOR"
        :aria-label="t('tags:color-of', { tag: tag.id })"
        :disabled="busyId === tag.id"
        @change="setColor(tag.id, ($event.target as HTMLInputElement).value)"
      />
      <span class="label">{{ tag.id }}</span>
      <span class="sublabel typo-body-regular-small">{{ t('tags:object-count', { n: tag.objectCount }) }}</span>
      <UiButton
        v-if="tag.color !== undefined"
        accent="brand"
        variant="tertiary"
        size="small"
        :busy="busyId === tag.id"
        @click="setColor(tag.id, null)"
      >
        {{ t('action:remove-color') }}
      </UiButton>
    </div>
    <VtsStateHero v-if="tags.length === 0" type="no-data" format="card" horizontal size="extra-small">
      {{ t('tags:none') }}
    </VtsStateHero>
  </UiCard>
</template>

<script setup lang="ts">
import { isTagColor, toErrorMessage } from '@/modules/system/utils/system.util.ts'
import { fetchGet, fetchPatch } from '@/shared/utils/fetch.util.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

type Tag = { id: string; color?: string; objectCount: number }

const DEFAULT_COLOR = '#808080'

const { t } = useI18n()

const tags = ref<Tag[]>([])
const busyId = ref<string>()
const actionError = ref<string>()

async function load() {
  try {
    tags.value = await fetchGet<Tag[]>('tags')
  } catch (error) {
    actionError.value = toErrorMessage(error)
  }
}

onMounted(load)

async function setColor(id: string, color: string | null) {
  if (color !== null && !isTagColor(color)) {
    return
  }
  busyId.value = id
  actionError.value = undefined
  try {
    await fetchPatch(`tags/${encodeURIComponent(id)}`, { color })
    await load()
  } catch (error) {
    actionError.value = toErrorMessage(error)
  } finally {
    busyId.value = undefined
  }
}
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
  padding-block: 0.4rem;

  .color {
    width: 3.2rem;
    height: 2.4rem;
    padding: 0;
    border: none;
    background: none;
    cursor: pointer;
  }

  .label {
    flex: 1;
    overflow-wrap: anywhere;
  }
}
</style>
