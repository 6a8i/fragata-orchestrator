<template>
  <UiTableCell>
    <div class="user-name">
      <UiUserLogo size="small" />
      <UiLink v-if="to !== undefined || href !== undefined" :to :href size="medium">
        {{ content }}
      </UiLink>
      <span v-else>{{ content }}</span>
    </div>
  </UiTableCell>
</template>

<script setup lang="ts">
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiTableCell from '@core/components/ui/table-cell/UiTableCell.vue'
import UiUserLogo from '@core/components/ui/user-logo/UiUserLogo.vue'
import type { LinkOptions } from '@core/composables/link-component.composable.ts'

const { to, href } = defineProps<
  LinkOptions & {
    content: string
  }
>()
</script>

<style scoped lang="postcss">
.user-name {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}
</style>
