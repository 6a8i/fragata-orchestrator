<template>
  <VtsContentSidePanel>
    <div class="container">
      <UiCard>
        <GroupsTable :groups :busy="!areGroupsReady">
          <template #title-actions>
            <UiButton variant="primary" accent="brand" size="medium" left-icon="fa:plus" @click="newGroup()">
              {{ t('new') }}
            </UiButton>
          </template>
        </GroupsTable>
      </UiCard>
    </div>

    <GroupSidePanel :group="selectedGroup" @close="selectedGroup = undefined" />
  </VtsContentSidePanel>
</template>

<script setup lang="ts">
import GroupSidePanel from '@/modules/group/components/GroupSidePanel.vue'
import GroupsTable from '@/modules/group/components/GroupsTable.vue'
import { type FrontXoGroup, useXoGroupCollection } from '@/modules/group/remote-ressources/use-xo-group-collection.ts'
import { useNameInputModal } from '@/modules/user/composables/use-name-input-modal.composable.ts'
import { createGroup } from '@/modules/user/utils/user-management.api.ts'
import VtsContentSidePanel from '@core/components/layout/VtsContentSidePanel.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const { groups, getGroupById, areGroupsReady } = useXoGroupCollection()

const selectedGroup = useRouteQuery<FrontXoGroup | undefined>('id', {
  toData: id => getGroupById(id as FrontXoGroup['id']),
  toQuery: group => group?.id ?? '',
})

const selectedGroupId = useRouteQuery('id')

const { askName } = useNameInputModal()

function newGroup() {
  askName({ title: t('action:new-group'), label: t('name'), confirmLabel: t('action:create') }, async name => {
    const { id } = await createGroup(name)
    selectedGroupId.value = id
  })
}
</script>

<style scoped lang="postcss">
.container {
  height: fit-content;
  margin: 0.8rem;
}
</style>
