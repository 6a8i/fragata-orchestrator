<template>
  <UiPanelCard class="user-roles-card">
    <UiPanelCardTitle size="medium" :label="t('roles-applied')" :counter="userRoles.length" />

    <div v-if="userRoles.length > 0">
      <div v-for="role in userRoles" :key="role.id" class="role">
        <VtsIcon size="medium" name="fa:shield-halved" />
        <span>{{ role.name }}</span>
        <span v-if="role.viaGroup" class="via-group typo-body-regular-small">{{ t('user:via-group') }}</span>
      </div>
    </div>

    <VtsStateHero v-else type="no-data" format="card" horizontal size="extra-small">
      {{ t('no-role-applied') }}
    </VtsStateHero>
  </UiPanelCard>
</template>

<script lang="ts" setup>
import { useXoAclRoleCollection } from '@/modules/acl-role/remote-resources/use-xo-acl-role-collection.ts'
import type { FrontXoUser } from '@/modules/user/remote-resources/use-xo-user-collection.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { user } = defineProps<{
  user: FrontXoUser
}>()

const { t } = useI18n()

const { aclRoles } = useXoAclRoleCollection()

// roles bound to the user directly, then those inherited from its groups
const userRoles = computed(() =>
  aclRoles.value
    .filter(role => role.isTemplate !== true)
    .flatMap(role => {
      if (role.userIds?.includes(user.id)) {
        return [{ id: role.id, name: role.name, viaGroup: false }]
      }
      if (role.groupIds?.some(groupId => user.groups.includes(groupId))) {
        return [{ id: role.id, name: role.name, viaGroup: true }]
      }
      return []
    })
)
</script>

<style scoped lang="postcss">
.user-roles-card {
  .role {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    margin-block: 0.6rem;
  }

  .via-group {
    color: var(--color-neutral-txt-secondary);
  }
}
</style>
