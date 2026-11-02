<template>
  <UiHeadBar icon="fa:layer-group">{{ t('self-service') }}</UiHeadBar>
  <VtsContentSidePanel>
    <div class="container">
      <UiCard>
        <p class="hint typo-body-regular-small">{{ t('resource-set:hint') }}</p>
        <ResourceSetsTable :resource-sets :busy="!areResourceSetsReady" :error="hasResourceSetFetchError">
          <template #title-actions>
            <UiButton variant="secondary" accent="brand" size="medium" :busy="isRecomputing" @click="recompute()">
              {{ t('action:recompute-usage') }}
            </UiButton>
            <UiButton variant="primary" accent="brand" size="medium" left-icon="fa:plus" @click="openModal()">
              {{ t('new') }}
            </UiButton>
          </template>
        </ResourceSetsTable>
      </UiCard>
    </div>

    <ResourceSetSidePanel
      :resource-set="selectedSet"
      @close="selectedSet = undefined"
      @edit="openModal($event)"
      @deleted="onDeleted()"
    />
  </VtsContentSidePanel>
</template>

<script setup lang="ts">
import ResourceSetSidePanel from '@/modules/resource-set/components/ResourceSetSidePanel.vue'
import ResourceSetsTable from '@/modules/resource-set/components/ResourceSetsTable.vue'
import { type ResourceSetPayload, useXoResourceSetSaveJob } from '@/modules/resource-set/jobs/xo-resource-set.jobs.ts'
import {
  type FrontXoResourceSet,
  useXoResourceSetCollection,
} from '@/modules/resource-set/remote-resources/use-xo-resource-set-collection.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import VtsContentSidePanel from '@core/components/layout/VtsContentSidePanel.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { KEEP_OVERLAY_OPEN } from '@core/packages/overlay/symbols.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const { resourceSets, getResourceSetById, areResourceSetsReady, hasResourceSetFetchError, reloadResourceSets } =
  useXoResourceSetCollection()

const selectedSet = useRouteQuery<FrontXoResourceSet | undefined>('id', {
  toData: id => getResourceSetById(id),
  toQuery: set => set?.id ?? '',
})

const editedSetId = ref<string>()
const payload = ref<ResourceSetPayload>()

const { run: save } = useXoResourceSetSaveJob(editedSetId, payload)

const { open } = useOverlay({
  component: () => import('@/modules/resource-set/components/modal/ResourceSetModal.vue'),
  events: {
    onConfirm: async (newPayload: ResourceSetPayload) => {
      payload.value = newPayload

      try {
        await save()
        await reloadResourceSets()
      } catch (error) {
        console.error('Failed to save the resource set', error)
        return KEEP_OVERLAY_OPEN
      }
    },
    onCancel: true,
  },
})

function openModal(set?: FrontXoResourceSet) {
  editedSetId.value = set?.id
  return open({ props: { resourceSet: set } })
}

async function onDeleted() {
  selectedSet.value = undefined
  await reloadResourceSets()
}

const isRecomputing = ref(false)

async function recompute() {
  isRecomputing.value = true
  try {
    await fetchPost('resource-sets/actions/recompute_limits')
    await reloadResourceSets()
  } finally {
    isRecomputing.value = false
  }
}
</script>

<style scoped lang="postcss">
.container {
  height: fit-content;
  margin: 0.8rem;
}

.hint {
  color: var(--color-neutral-txt-secondary);
}
</style>
