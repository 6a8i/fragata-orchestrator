<template>
  <VtsSidePanel :has-selection="!!resourceSet" @close="emit('close')">
    <template v-if="resourceSet" #actions>
      <UiButton
        accent="brand"
        variant="secondary"
        size="medium"
        left-icon="action:edit"
        @click="emit('edit', resourceSet)"
      >
        {{ t('action:edit') }}
      </UiButton>
      <UiButton
        v-tooltip="!canDelete && deleteErrorMessage"
        accent="danger"
        variant="secondary"
        size="medium"
        left-icon="action:delete"
        :disabled="!canDelete"
        :busy="isDeleting"
        @click="confirmDelete()"
      >
        {{ t('action:delete') }}
      </UiButton>
    </template>

    <template v-if="resourceSet" #default>
      <UiPanelCard>
        <UiPanelCardTitle size="medium" :label="resourceSet.name" />
        <VtsCardRowKeyValue>
          <template #key>{{ t('vcpus') }}</template>
          <template #value>{{ formatUsage(resourceSet.limits.cpus) ?? t('resource-set:unlimited') }}</template>
        </VtsCardRowKeyValue>
        <VtsCardRowKeyValue>
          <template #key>{{ t('ram') }}</template>
          <template #value>
            {{ formatUsage(resourceSet.limits.memory, formatGib) ?? t('resource-set:unlimited') }}
          </template>
        </VtsCardRowKeyValue>
        <VtsCardRowKeyValue>
          <template #key>{{ t('disk-space') }}</template>
          <template #value>
            {{ formatUsage(resourceSet.limits.disk, formatGib) ?? t('resource-set:unlimited') }}
          </template>
        </VtsCardRowKeyValue>
        <VtsCardRowKeyValue>
          <template #key>{{ t('resource-set:share-by-default') }}</template>
          <template #value>{{ resourceSet.shareByDefault ? t('on') : t('off') }}</template>
        </VtsCardRowKeyValue>
      </UiPanelCard>

      <UiPanelCard>
        <UiPanelCardTitle size="medium" :label="t('resource-set:subjects')" :counter="subjects.length" />
        <div v-for="subject of subjects" :key="subject.id" class="row">
          <VtsIcon size="medium" :name="subject.icon" />
          {{ subject.label }}
        </div>
      </UiPanelCard>

      <UiPanelCard>
        <UiPanelCardTitle size="medium" :label="t('resource-set:objects')" :counter="objects.length" />
        <div v-for="object of objects" :key="object.id" class="row">
          <VtsIcon size="medium" :name="object.icon" />
          {{ object.label }}
        </div>
      </UiPanelCard>
    </template>
  </VtsSidePanel>
</template>

<script setup lang="ts">
import { useXoGroupCollection } from '@/modules/group/remote-ressources/use-xo-group-collection.ts'
import { useXoNetworkCollection } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import { useXoResourceSetDeleteJob } from '@/modules/resource-set/jobs/xo-resource-set.jobs.ts'
import type { FrontXoResourceSet } from '@/modules/resource-set/remote-resources/use-xo-resource-set-collection.ts'
import { formatGib, formatUsage } from '@/modules/resource-set/utils/resource-set.util.ts'
import { useXoSrCollection } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { useXoUserCollection } from '@/modules/user/remote-resources/use-xo-user-collection.ts'
import { useXoVmTemplateCollection } from '@/modules/vm/remote-resources/use-xo-vm-template-collection.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsSidePanel from '@core/components/panel/VtsSidePanel.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import { useDeleteModal } from '@core/composables/modals/use-delete-modal.ts'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import type { IconName } from '@core/icons'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { resourceSet } = defineProps<{
  resourceSet?: FrontXoResourceSet
}>()

const emit = defineEmits<{
  close: []
  edit: [resourceSet: FrontXoResourceSet]
  deleted: []
}>()

const { t } = useI18n()

const { users } = useXoUserCollection()
const { groups } = useXoGroupCollection()
const { templates } = useXoVmTemplateCollection()
const { srs } = useXoSrCollection()
const { networks } = useXoNetworkCollection()

type Row = { id: string; label: string; icon: IconName }

const subjects = computed<Row[]>(() =>
  (resourceSet?.subjects ?? []).map(id => {
    const user = users.value.find(candidate => candidate.id === id)
    if (user !== undefined) {
      return { id, label: user.name ?? user.email, icon: 'fa:user' }
    }
    const group = groups.value.find(candidate => candidate.id === id)
    return { id, label: group?.name ?? id, icon: 'fa:object-group' }
  })
)

const objects = computed<Row[]>(() =>
  (resourceSet?.objects ?? []).map(id => {
    const template = templates.value.find(candidate => candidate.id === id)
    if (template !== undefined) {
      return { id, label: template.name_label, icon: 'object:vm' }
    }
    const sr = srs.value.find(candidate => candidate.id === id)
    if (sr !== undefined) {
      return { id, label: sr.name_label, icon: 'object:sr' }
    }
    const network = networks.value.find(candidate => candidate.id === id)
    return { id, label: network?.name_label ?? id, icon: 'object:network' }
  })
)

const {
  run: deleteResourceSet,
  canRun: canDelete,
  isRunning: isDeleting,
  errorMessage: deleteErrorMessage,
} = useXoResourceSetDeleteJob(() => resourceSet)

const { open: openDeleteModal } = useDeleteModal()

function confirmDelete() {
  if (resourceSet === undefined) {
    return
  }

  return openDeleteModal({
    props: {
      subject: resourceSet.name,
      confirmLabel: t('action:delete'),
      description: t('modal:delete-resource-set-description'),
    },
    events: {
      onConfirm: () => deleteResourceSet({ detached: true, onSuccess: () => emit('deleted') }),
    },
  })
}
</script>

<style scoped lang="postcss">
.row {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding-block: 0.4rem;
}
</style>
