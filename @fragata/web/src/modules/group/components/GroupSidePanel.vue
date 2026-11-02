<template>
  <VtsSidePanel :has-selection="!!group" @close="emit('close')">
    <template v-if="group" #actions>
      <UiButton accent="brand" variant="secondary" size="medium" left-icon="action:edit" @click="rename()">
        {{ t('action:rename') }}
      </UiButton>
      <UiButton accent="danger" variant="secondary" size="medium" left-icon="action:delete" @click="remove()">
        {{ t('action:delete') }}
      </UiButton>
    </template>

    <template v-if="group" #default>
      <UiPanelCard>
        <UiPanelCardTitle size="medium" :label="t('members')" :counter="members.length" />

        <div v-for="member in members" :key="member.id" class="row">
          <VtsIcon size="medium" name="fa:user" />
          <span class="label">{{ member.name ?? member.email }}</span>
          <UiButtonIcon
            v-tooltip="t('action:remove')"
            accent="danger"
            size="small"
            icon="fa:xmark"
            :busy="busyId === member.id"
            @click="run(member.id, () => removeUserFromGroup(group!.id, member.id))"
          />
        </div>

        <VtsStateHero v-if="members.length === 0" type="no-data" format="card" horizontal size="extra-small">
          {{ t('no-member') }}
        </VtsStateHero>

        <div class="add-row">
          <VtsSelect :id="userSelectId" accent="brand" />
          <UiButton
            accent="brand"
            variant="primary"
            size="small"
            left-icon="fa:plus"
            :disabled="userToAdd === undefined"
            :busy="busyId === 'add'"
            @click="run('add', () => addUserToGroup(group!.id, userToAdd!))"
          >
            {{ t('action:add') }}
          </UiButton>
        </div>
      </UiPanelCard>

      <UiPanelCard>
        <UiPanelCardTitle size="medium" :label="t('roles-applied')" :counter="groupRoles.length" />
        <div v-for="role in groupRoles" :key="role.id" class="row">
          <VtsIcon size="medium" name="fa:shield-halved" />
          <span class="label">{{ role.name }}</span>
        </div>
        <VtsStateHero v-if="groupRoles.length === 0" type="no-data" format="card" horizontal size="extra-small">
          {{ t('no-role-applied') }}
        </VtsStateHero>
      </UiPanelCard>

      <UiAlert v-if="actionError !== undefined" accent="danger">{{ actionError }}</UiAlert>
    </template>
  </VtsSidePanel>
</template>

<script lang="ts" setup>
import { useXoAclRoleCollection } from '@/modules/acl-role/remote-resources/use-xo-acl-role-collection.ts'
import type { FrontXoGroup } from '@/modules/group/remote-ressources/use-xo-group-collection.ts'
import { useNameInputModal } from '@/modules/user/composables/use-name-input-modal.composable.ts'
import { useXoUserCollection } from '@/modules/user/remote-resources/use-xo-user-collection.ts'
import {
  addUserToGroup,
  deleteGroup,
  removeUserFromGroup,
  renameGroup,
} from '@/modules/user/utils/user-management.api.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsSidePanel from '@core/components/panel/VtsSidePanel.vue'
import VtsSelect from '@core/components/select/VtsSelect.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import { useDeleteModal } from '@core/composables/modals/use-delete-modal.ts'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useFormSelect } from '@core/packages/form-select'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { group } = defineProps<{
  group?: FrontXoGroup
}>()

const emit = defineEmits<{
  close: []
}>()

const { t } = useI18n()

const { users } = useXoUserCollection()
const { aclRoles } = useXoAclRoleCollection()

const members = computed(() => (group === undefined ? [] : users.value.filter(user => group.users.includes(user.id))))
const nonMembers = computed(() =>
  group === undefined ? [] : users.value.filter(user => !group.users.includes(user.id))
)
const groupRoles = computed(() =>
  group === undefined ? [] : aclRoles.value.filter(role => role.groupIds?.includes(group.id))
)

const userToAdd = ref<string>()

const { id: userSelectId } = useFormSelect(nonMembers, {
  model: userToAdd,
  searchable: true,
  placeholder: () => t('select-user'),
  option: { label: user => user.name ?? user.email, value: 'id' },
})

const busyId = ref<string>()
const actionError = ref<string>()

async function run(id: string, fn: () => Promise<unknown>) {
  busyId.value = id
  actionError.value = undefined
  try {
    await fn()
    if (id === 'add') {
      userToAdd.value = undefined
    }
  } catch (error) {
    actionError.value = (error as Error).message
  } finally {
    busyId.value = undefined
  }
}

const { askName } = useNameInputModal()

function rename() {
  if (group === undefined) return
  const groupId = group.id
  askName(
    { title: t('action:rename-group'), label: t('name'), confirmLabel: t('action:save'), initialValue: group.name },
    name => run('rename', () => renameGroup(groupId, name))
  )
}

const selectedGroupId = useRouteQuery('id')
const { open: openDeleteModal } = useDeleteModal()

function remove() {
  if (group === undefined) return
  const groupId = group.id
  openDeleteModal({
    props: { subject: group.name, confirmLabel: t('action:delete'), description: t('modal:delete-group-description') },
    events: {
      onConfirm: () =>
        run('delete', async () => {
          await deleteGroup(groupId)
          selectedGroupId.value = ''
        }),
    },
  })
}
</script>

<style lang="postcss" scoped>
.row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-block: 0.4rem;

  .label {
    flex: 1;
  }
}

.add-row {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  margin-block-start: 0.8rem;

  & > :first-child {
    flex: 1;
  }
}
</style>
