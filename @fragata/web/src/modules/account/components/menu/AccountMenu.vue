<template>
  <MenuList :disabled placement="bottom-end">
    <template #trigger="{ isOpen, open }">
      <UiAccountMenuButton
        v-tooltip="isOpen ? false : { content: t('account-organization-more'), placement: 'bottom-end' }"
        :selected="isOpen"
        size="medium"
        @click="open($event)"
      />
    </template>

    <MenuItem v-for="(link, index) in links" :key="index" accent="brand">
      <UiLink size="small" class="link" v-bind="link.props">
        {{ link.label }}
      </UiLink>
    </MenuItem>

    <MenuItem accent="brand" icon="fa:arrow-right-from-bracket" @click="logout()">
      <span class="link">{{ t('action:log-out') }}</span>
    </MenuItem>
  </MenuList>
</template>

<script lang="ts" setup>
import { FRAGATA_HOST_LINKS, FRAGATA_LINKS } from '@/shared/constants.ts'
import type { IconName } from '@core/icons'
import MenuItem from '@core/components/menu/MenuItem.vue'
import MenuList from '@core/components/menu/MenuList.vue'
import UiAccountMenuButton from '@core/components/ui/account-menu-button/UiAccountMenuButton.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { type LinkOptions } from '@core/composables/link-component.composable.ts'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  disabled?: boolean
}>()

const { t } = useI18n()

// TODO: Fetch the Fragata Classic mount path from API when available
const logout = () => window.location.assign('/signout')

const links = computed<{ label: string; props: LinkOptions & { icon: IconName } }[]>(() => [
  {
    label: t('settings'),
    props: {
      icon: 'fa:gear',
      to: '/settings',
    },
  },
  {
    label: t('documentation-name', { name: 'Fragata' }),
    props: {
      icon: 'fa:book',
      href: FRAGATA_LINKS.DOC,
    },
  },
  {
    label: t('documentation-name', { name: 'Fragata Host' }),
    props: {
      icon: 'fa:book',
      href: FRAGATA_HOST_LINKS.DOC,
    },
  },
  {
    label: t('documentation-name', { name: t('rest-api') }),
    props: {
      icon: 'fa:code',
      href: '/rest/v0/docs/#/',
    },
  },
  {
    label: t('send-us-feedback'),
    props: {
      icon: 'fa:message',
      href: FRAGATA_LINKS.COMMUNITY,
    },
  },
])
</script>

<style lang="postcss" scoped>
.link {
  text-decoration: none;
  color: var(--color-brand-txt-base);
  /* Make the link take the height of the MenuItem component */
  padding-block: 1.2rem;
  /* Make the link take the available width in the MenuItem component */
  flex-grow: 1;
}
</style>
