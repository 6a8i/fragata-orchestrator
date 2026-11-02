<template>
  <UiHeadBar icon="fa:network-wired">{{ t('ip-pools') }}</UiHeadBar>
  <VtsContentSidePanel>
    <div class="container">
      <UiCard>
        <IpPoolsTable :ip-pools :busy="!areIpPoolsReady" :error="hasIpPoolFetchError">
          <template #title-actions>
            <UiButton variant="primary" accent="brand" size="medium" left-icon="fa:plus" @click="openModal()">
              {{ t('new') }}
            </UiButton>
          </template>
        </IpPoolsTable>
      </UiCard>
    </div>

    <IpPoolSidePanel
      :ip-pool="selectedIpPool"
      @close="selectedIpPool = undefined"
      @edit="openModal($event)"
      @deleted="onDeleted()"
    />
  </VtsContentSidePanel>
</template>

<script setup lang="ts">
import IpPoolSidePanel from '@/modules/ip-pool/components/IpPoolSidePanel.vue'
import IpPoolsTable from '@/modules/ip-pool/components/IpPoolsTable.vue'
import { type IpPoolPayload, useXoIpPoolSaveJob } from '@/modules/ip-pool/jobs/xo-ip-pool.jobs.ts'
import {
  type FrontXoIpPool,
  useXoIpPoolCollection,
} from '@/modules/ip-pool/remote-resources/use-xo-ip-pool-collection.ts'
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

const { ipPools, getIpPoolById, areIpPoolsReady, hasIpPoolFetchError, reloadIpPools } = useXoIpPoolCollection()

const selectedIpPool = useRouteQuery<FrontXoIpPool | undefined>('id', {
  toData: id => getIpPoolById(id),
  toQuery: ipPool => ipPool?.id ?? '',
})

const editedIpPoolId = ref<string>()
const payload = ref<IpPoolPayload>()

const { run: save } = useXoIpPoolSaveJob(editedIpPoolId, payload)

const { open } = useOverlay({
  component: () => import('@/modules/ip-pool/components/modal/IpPoolModal.vue'),
  events: {
    onConfirm: async (newPayload: IpPoolPayload) => {
      payload.value = newPayload

      try {
        await save()
        await reloadIpPools()
      } catch (error) {
        console.error('Failed to save the IP pool', error)
        return KEEP_OVERLAY_OPEN
      }
    },
    onCancel: true,
  },
})

function openModal(ipPool?: FrontXoIpPool) {
  editedIpPoolId.value = ipPool?.id
  return open({ props: { ipPool } })
}

async function onDeleted() {
  selectedIpPool.value = undefined
  await reloadIpPools()
}
</script>

<style scoped lang="postcss">
.container {
  height: fit-content;
  margin: 0.8rem;
}
</style>
