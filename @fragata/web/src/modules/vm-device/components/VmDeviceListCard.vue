<template>
  <UiCard>
    <UiTitle>
      {{ title }}
    </UiTitle>
    <p v-if="hint" class="hint typo-body-regular-small">{{ hint }}</p>

    <div v-for="item of items" :key="item.id" class="row">
      <VtsIcon size="medium" :name="icon" />
      <div class="label">
        <span>{{ item.label }}</span>
        <span v-if="item.sublabel" class="sublabel typo-body-regular-small">{{ item.sublabel }}</span>
      </div>
      <UiButtonIcon
        v-tooltip="removeLabel"
        accent="danger"
        size="small"
        icon="fa:xmark"
        :disabled="disabled"
        :busy="busyId === item.id"
        @click="emit('remove', item.id)"
      />
    </div>

    <VtsStateHero v-if="items.length === 0" type="no-data" format="card" horizontal size="extra-small">
      {{ emptyLabel }}
    </VtsStateHero>

    <div v-if="slots.add" class="add-row">
      <slot name="add" />
    </div>
  </UiCard>
</template>

<script setup lang="ts">
import type { IconName } from '@core/icons'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'

defineProps<{
  title: string
  icon: IconName
  items: { id: string; label: string; sublabel?: string }[]
  emptyLabel: string
  removeLabel: string
  hint?: string
  disabled?: boolean
  busyId?: string
}>()

const emit = defineEmits<{
  remove: [id: string]
}>()

const slots = defineSlots<{
  add?(): any
}>()
</script>

<style scoped lang="postcss">
.hint {
  color: var(--color-neutral-txt-secondary);
}

.row {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding-block: 0.4rem;

  .label {
    display: flex;
    flex: 1;
    flex-direction: column;
  }

  .sublabel {
    color: var(--color-neutral-txt-secondary);
  }
}

.add-row {
  display: flex;
  align-items: center;
  gap: 0.8rem;

  & > :first-child {
    flex: 1;
  }
}
</style>
