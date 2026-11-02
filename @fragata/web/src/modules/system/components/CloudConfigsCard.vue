<template>
  <UiCard>
    <div class="header">
      <UiTitle>{{ t('cloud-configs') }}</UiTitle>
      <UiButton accent="brand" variant="primary" size="small" left-icon="fa:plus" @click="openModal()">
        {{ t('new') }}
      </UiButton>
    </div>
    <p class="description">{{ t('cloud-configs:description') }}</p>
    <UiAlert v-if="actionError !== undefined" accent="danger">{{ actionError }}</UiAlert>

    <div v-for="config of cloudConfigs" :key="config.id" class="row">
      <span class="label">{{ config.name }}</span>
      <UiInfo :accent="config.type === 'network' ? 'info' : 'muted'">
        {{ config.type === 'network' ? t('cloud-configs:network') : t('cloud-configs:user-data') }}
      </UiInfo>
      <UiButtonIcon
        v-tooltip="t('action:edit')"
        icon="action:edit"
        accent="brand"
        size="small"
        @click="openModal(config)"
      />
      <UiButtonIcon
        v-tooltip="t('action:delete')"
        icon="fa:trash"
        accent="brand"
        size="small"
        :disabled="busyId === config.id"
        @click="confirmDelete(config)"
      />
    </div>
    <VtsStateHero v-if="cloudConfigs.length === 0" type="no-data" format="card" horizontal size="extra-small">
      {{ t('cloud-configs:none') }}
    </VtsStateHero>
  </UiCard>
</template>

<script setup lang="ts">
import type { CloudConfig, CloudConfigPayload } from '@/modules/system/components/modal/CloudConfigModal.vue'
import { toErrorMessage } from '@/modules/system/utils/system.util.ts'
import { fetchDelete, fetchGet, fetchPatch, fetchPost } from '@/shared/utils/fetch.util.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useDeleteModal } from '@core/composables/modals/use-delete-modal.ts'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { KEEP_OVERLAY_OPEN } from '@core/packages/overlay/symbols.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const cloudConfigs = ref<CloudConfig[]>([])
const busyId = ref<string>()
const actionError = ref<string>()
const editedId = ref<string>()

async function load() {
  try {
    cloudConfigs.value = await fetchGet<CloudConfig[]>('cloud-configs')
  } catch (error) {
    actionError.value = toErrorMessage(error)
  }
}

onMounted(load)

const { open } = useOverlay({
  component: () => import('@/modules/system/components/modal/CloudConfigModal.vue'),
  events: {
    onConfirm: async (payload: CloudConfigPayload) => {
      actionError.value = undefined
      try {
        if (editedId.value === undefined) {
          await fetchPost('cloud-configs', payload)
        } else {
          await fetchPatch(`cloud-configs/${editedId.value}`, { name: payload.name, template: payload.template })
        }
        await load()
      } catch (error) {
        actionError.value = toErrorMessage(error)
        return KEEP_OVERLAY_OPEN
      }
    },
    onCancel: true,
  },
})

function openModal(cloudConfig?: CloudConfig) {
  editedId.value = cloudConfig?.id
  return open({ props: { cloudConfig } })
}

const { open: openDeleteModal } = useDeleteModal()

function confirmDelete(cloudConfig: CloudConfig) {
  return openDeleteModal({
    props: { subject: cloudConfig.name, confirmLabel: t('action:delete') },
    events: {
      onConfirm: async () => {
        busyId.value = cloudConfig.id
        actionError.value = undefined
        try {
          await fetchDelete(`cloud-configs/${cloudConfig.id}`)
          await load()
        } catch (error) {
          actionError.value = toErrorMessage(error)
        } finally {
          busyId.value = undefined
        }
      },
    },
  })
}
</script>

<style scoped lang="postcss">
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.description {
  color: var(--color-neutral-txt-secondary);
}

.row {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding-block: 0.4rem;

  .label {
    flex: 1;
  }
}
</style>
