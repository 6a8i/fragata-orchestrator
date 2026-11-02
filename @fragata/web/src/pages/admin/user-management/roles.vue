<template>
  <VtsContentSidePanel>
    <div class="container">
      <UiCard>
        <AclRolesTable :roles="aclRoles" :busy="!areAclRolesReady" />
      </UiCard>
    </div>

    <AclRoleSidePanel :role="selectedRole" @close="selectedRole = undefined" />
  </VtsContentSidePanel>
</template>

<script setup lang="ts">
import AclRoleSidePanel from '@/modules/acl-role/components/AclRoleSidePanel.vue'
import AclRolesTable from '@/modules/acl-role/components/AclRolesTable.vue'
import {
  type FrontXoAclRole,
  useXoAclRoleCollection,
} from '@/modules/acl-role/remote-resources/use-xo-acl-role-collection.ts'
import VtsContentSidePanel from '@core/components/layout/VtsContentSidePanel.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'

const { aclRoles, getAclRoleById, areAclRolesReady } = useXoAclRoleCollection()

const selectedRole = useRouteQuery<FrontXoAclRole | undefined>('id', {
  toData: id => getAclRoleById(id as FrontXoAclRole['id']),
  toQuery: role => role?.id ?? '',
})
</script>

<style scoped lang="postcss">
.container {
  height: fit-content;
  margin: 0.8rem;
}
</style>
