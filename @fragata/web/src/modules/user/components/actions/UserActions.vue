<template>
  <UiButton
    accent="brand"
    variant="secondary"
    size="medium"
    left-icon="action:edit"
    :disabled="!canEditUser"
    @click="openEditUserDrawer()"
  >
    {{ t('action:edit') }}
  </UiButton>
  <MenuList placement="bottom-end">
    <template #trigger="{ open }">
      <UiButtonIcon
        v-tooltip="{ placement: 'left', content: t('more-actions') }"
        accent="brand"
        icon="action:more-actions"
        size="medium"
        @click="open($event)"
      />
    </template>
    <MenuItem
      v-tooltip="isCurrentUser ? t('user:cannot-delete-yourself') : !canDeleteUser && deleteUserErrorMessage"
      accent="danger"
      icon="action:delete"
      :disabled="isCurrentUser || !canDeleteUser"
      :busy="isDeletingUser"
      @click="deleteUser()"
    >
      {{ t('action:delete') }}
    </MenuItem>
  </MenuList>
</template>

<script lang="ts" setup>
import { useUserManagement } from '@/modules/user/composables/use-user-management.composable.ts'
import { useXoCurrentUser } from '@/modules/user/remote-resources/use-xo-current-user.ts'
import type { FrontXoUser } from '@/modules/user/remote-resources/use-xo-user-collection.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import MenuList from '@core/components/menu/MenuList.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { user } = defineProps<{
  user: FrontXoUser
}>()

const { t } = useI18n()

const { openEditUserDrawer, canEditUser, deleteUser, canDeleteUser, isDeletingUser, deleteUserErrorMessage } =
  useUserManagement(() => user)

// deleting your own account would lock you out
const { currentUser } = useXoCurrentUser()
const isCurrentUser = computed(() => currentUser.value?.id === user.id)
</script>
