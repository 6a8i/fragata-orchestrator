<template>
  <VtsSidePanel :has-selection="!!role" @close="emit('close')">
    <template v-if="role" #actions>
      <UiButton accent="brand" variant="secondary" size="medium" left-icon="fa:copy" @click="copy()">
        {{ role.isTemplate ? t('roles:use-template') : t('action:copy') }}
      </UiButton>
      <UiButton
        v-if="!role.isTemplate"
        accent="danger"
        variant="secondary"
        size="medium"
        left-icon="action:delete"
        @click="remove()"
      >
        {{ t('action:delete') }}
      </UiButton>
    </template>

    <template v-if="role" #default>
      <UiPanelCard>
        <UiPanelCardTitle size="medium" :label="role.name" />
        <p v-if="role.description" class="description">{{ role.description }}</p>
        <p class="description">{{ t('n-privileges', { n: role.privilegeIds.length }) }}</p>
        <UiAlert v-if="role.isTemplate" accent="info">{{ t('roles:template-cannot-be-assigned') }}</UiAlert>
      </UiPanelCard>

      <template v-if="!role.isTemplate">
        <UiPanelCard>
          <UiPanelCardTitle size="medium" :label="t('users')" :counter="assignedUsers.length" />
          <div v-for="user in assignedUsers" :key="user.id" class="row">
            <VtsIcon size="medium" name="fa:user" />
            <span class="label">{{ user.name ?? user.email }}</span>
            <UiButtonIcon
              v-tooltip="t('action:remove')"
              accent="danger"
              size="small"
              icon="fa:xmark"
              :busy="busyId === user.id"
              @click="run(user.id, () => unassignAclRoleFromUser(role!.id, user.id))"
            />
          </div>
          <div class="add-row">
            <VtsSelect :id="userSelectId" accent="brand" />
            <UiButton
              accent="brand"
              variant="primary"
              size="small"
              left-icon="fa:plus"
              :disabled="userToAdd === undefined"
              :busy="busyId === 'add-user'"
              @click="run('add-user', () => assignAclRoleToUser(role!.id, userToAdd!))"
            >
              {{ t('action:add') }}
            </UiButton>
          </div>
        </UiPanelCard>

        <UiPanelCard>
          <UiPanelCardTitle size="medium" :label="t('groups')" :counter="assignedGroups.length" />
          <div v-for="group in assignedGroups" :key="group.id" class="row">
            <VtsIcon size="medium" name="table:group" />
            <span class="label">{{ group.name }}</span>
            <UiButtonIcon
              v-tooltip="t('action:remove')"
              accent="danger"
              size="small"
              icon="fa:xmark"
              :busy="busyId === group.id"
              @click="run(group.id, () => unassignAclRoleFromGroup(role!.id, group.id))"
            />
          </div>
          <div class="add-row">
            <VtsSelect :id="groupSelectId" accent="brand" />
            <UiButton
              accent="brand"
              variant="primary"
              size="small"
              left-icon="fa:plus"
              :disabled="groupToAdd === undefined"
              :busy="busyId === 'add-group'"
              @click="run('add-group', () => assignAclRoleToGroup(role!.id, groupToAdd!))"
            >
              {{ t('action:add') }}
            </UiButton>
          </div>
        </UiPanelCard>
      </template>

      <UiAlert v-if="actionError !== undefined" accent="danger">{{ actionError }}</UiAlert>
    </template>
  </VtsSidePanel>
</template>

<script lang="ts" setup>
import type { FrontXoAclRole } from '@/modules/acl-role/remote-resources/use-xo-acl-role-collection.ts'
import { useXoGroupCollection } from '@/modules/group/remote-ressources/use-xo-group-collection.ts'
import { useNameInputModal } from '@/modules/user/composables/use-name-input-modal.composable.ts'
import { useXoUserCollection } from '@/modules/user/remote-resources/use-xo-user-collection.ts'
import {
  assignAclRoleToGroup,
  assignAclRoleToUser,
  copyAclRole,
  deleteAclRole,
  unassignAclRoleFromGroup,
  unassignAclRoleFromUser,
} from '@/modules/user/utils/user-management.api.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsSidePanel from '@core/components/panel/VtsSidePanel.vue'
import VtsSelect from '@core/components/select/VtsSelect.vue'
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

const { role } = defineProps<{
  role?: FrontXoAclRole
}>()

const emit = defineEmits<{
  close: []
}>()

const { t } = useI18n()

const { users } = useXoUserCollection()
const { groups } = useXoGroupCollection()

const assignedUsers = computed(() => users.value.filter(user => role?.userIds?.includes(user.id)))
const assignedGroups = computed(() => groups.value.filter(group => role?.groupIds?.includes(group.id)))
const otherUsers = computed(() => users.value.filter(user => !role?.userIds?.includes(user.id)))
const otherGroups = computed(() => groups.value.filter(group => !role?.groupIds?.includes(group.id)))

const userToAdd = ref<string>()
const groupToAdd = ref<string>()

const { id: userSelectId } = useFormSelect(otherUsers, {
  model: userToAdd,
  searchable: true,
  placeholder: () => t('select-user'),
  option: { label: user => user.name ?? user.email, value: 'id' },
})

const { id: groupSelectId } = useFormSelect(otherGroups, {
  model: groupToAdd,
  searchable: true,
  placeholder: () => t('select-group'),
  option: { label: 'name', value: 'id' },
})

const busyId = ref<string>()
const actionError = ref<string>()

async function run(id: string, fn: () => Promise<unknown>) {
  busyId.value = id
  actionError.value = undefined
  try {
    await fn()
    if (id === 'add-user') userToAdd.value = undefined
    if (id === 'add-group') groupToAdd.value = undefined
  } catch (error) {
    actionError.value = (error as Error).message
  } finally {
    busyId.value = undefined
  }
}

const selectedRoleId = useRouteQuery('id')

const { askName } = useNameInputModal()

function copy() {
  if (role === undefined) return
  const roleId = role.id
  askName(
    {
      title: t('roles:copy-title', { name: role.name }),
      label: t('name'),
      confirmLabel: t('action:create'),
      initialValue: `${role.name} (${t('copy')})`,
    },
    name =>
      run('copy', async () => {
        const { id } = await copyAclRole(roleId, name)
        selectedRoleId.value = id
      })
  )
}

const { open: openDeleteModal } = useDeleteModal()

function remove() {
  if (role === undefined) return
  const roleId = role.id
  openDeleteModal({
    props: { subject: role.name, confirmLabel: t('action:delete'), description: t('modal:delete-role-description') },
    events: {
      onConfirm: () =>
        run('delete', async () => {
          await deleteAclRole(roleId)
          selectedRoleId.value = ''
        }),
    },
  })
}
</script>

<style lang="postcss" scoped>
.description {
  color: var(--color-neutral-txt-secondary);
  margin-block: 0.4rem;
}

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
