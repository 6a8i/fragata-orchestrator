<template>
  <VtsSidePanel :has-selection="!!ipPool" @close="emit('close')">
    <template v-if="ipPool" #actions>
      <UiButton accent="brand" variant="secondary" size="medium" left-icon="action:edit" @click="emit('edit', ipPool)">
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

    <template v-if="ipPool" #default>
      <UiPanelCard>
        <UiPanelCardTitle size="medium" :label="ipPool.name" />
        <VtsCardRowKeyValue>
          <template #key>{{ t('ip-addresses') }}</template>
          <template #value>{{ ipPool.addresses.length }}</template>
        </VtsCardRowKeyValue>
        <VtsCardRowKeyValue>
          <template #key>{{ t('ip-pool:allocated') }}</template>
          <template #value>{{ ipPool.allocatedAddresses.length }}</template>
        </VtsCardRowKeyValue>
      </UiPanelCard>

      <UiPanelCard>
        <UiPanelCardTitle size="medium" :label="t('ip-addresses')" :counter="ranges.length" />
        <div v-for="range of ranges" :key="range" class="row">{{ range }}</div>
        <VtsStateHero v-if="ranges.length === 0" type="no-data" format="card" horizontal size="extra-small">
          {{ t('ip-pool:no-address') }}
        </VtsStateHero>
      </UiPanelCard>

      <UiPanelCard>
        <UiPanelCardTitle size="medium" :label="t('networks')" :counter="ipPool.networks.length" />
        <div v-for="networkId of ipPool.networks" :key="networkId" class="row">
          <VtsIcon size="medium" name="object:network" />
          {{ getNetworkById(networkId as FrontXoNetwork['id'])?.name_label ?? networkId }}
        </div>
      </UiPanelCard>
    </template>
  </VtsSidePanel>
</template>

<script setup lang="ts">
import { useXoIpPoolDeleteJob } from '@/modules/ip-pool/jobs/xo-ip-pool.jobs.ts'
import type { FrontXoIpPool } from '@/modules/ip-pool/remote-resources/use-xo-ip-pool-collection.ts'
import { collapseAddresses } from '@/modules/ip-pool/utils/ip-pool-addresses.util.ts'
import {
  type FrontXoNetwork,
  useXoNetworkCollection,
} from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsSidePanel from '@core/components/panel/VtsSidePanel.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import { useDeleteModal } from '@core/composables/modals/use-delete-modal.ts'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { ipPool } = defineProps<{
  ipPool?: FrontXoIpPool
}>()

const emit = defineEmits<{
  close: []
  edit: [ipPool: FrontXoIpPool]
  deleted: []
}>()

const { t } = useI18n()

const { getNetworkById } = useXoNetworkCollection()

const ranges = computed(() => collapseAddresses(ipPool?.addresses ?? []))

const {
  run: deleteIpPool,
  canRun: canDelete,
  isRunning: isDeleting,
  errorMessage: deleteErrorMessage,
} = useXoIpPoolDeleteJob(() => ipPool)

const { open: openDeleteModal } = useDeleteModal()

function confirmDelete() {
  if (ipPool === undefined) {
    return
  }

  return openDeleteModal({
    props: {
      subject: ipPool.name,
      confirmLabel: t('action:delete'),
      description: t('modal:delete-ip-pool-description'),
    },
    events: {
      onConfirm: () => deleteIpPool({ detached: true, onSuccess: () => emit('deleted') }),
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
