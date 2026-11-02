<template>
  <VtsSidePanel :has-selection="!!user" @close="emit('close')">
    <template v-if="user" #actions>
      <UserActions :user />
    </template>
    <template v-if="user" #default>
      <UserInfosCard :user />
      <UserGroupsCard :user />
      <UserRolesCard :user />
    </template>
  </VtsSidePanel>
</template>

<script setup lang="ts">
import UserActions from '@/modules/user/components/actions/UserActions.vue'
import UserGroupsCard from '@/modules/user/components/list/panel/cards/UserGroupsCard.vue'
import UserInfosCard from '@/modules/user/components/list/panel/cards/UserInfosCard.vue'
import UserRolesCard from '@/modules/user/components/list/panel/cards/UserRolesCard.vue'
import type { FrontXoUser } from '@/modules/user/remote-resources/use-xo-user-collection.ts'
import VtsSidePanel from '@core/components/panel/VtsSidePanel.vue'

defineProps<{
  user?: FrontXoUser
}>()

const emit = defineEmits<{
  close: []
}>()
</script>
