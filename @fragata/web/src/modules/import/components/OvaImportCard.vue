<template>
  <UiCard>
    <UiTitle>{{ t('import:ova') }}</UiTitle>
    <p class="description">{{ t('import:ova-description') }}</p>
    <UiAlert v-if="message !== undefined" :accent="message.accent">
      {{ message.content }}
      <RouterLink v-if="importedVmId !== undefined" :to="{ name: '/vm/[id]/dashboard', params: { id: importedVmId } }">
        {{ t('import:ova-open-vm') }}
      </RouterLink>
    </UiAlert>

    <input class="file-input" type="file" accept=".ova" :disabled="isBusy" @change="onFileChange($event)" />
    <UiInfo v-if="file !== undefined && !isOvaFile(file.name)" accent="danger">
      {{ t('import:ova-unsupported-file') }}
    </UiInfo>

    <VtsInputWrapper :label="t('pool')">
      <VtsSelect :id="poolSelectId" accent="brand" />
    </VtsInputWrapper>
    <VtsInputWrapper :label="t('storage-repository')">
      <VtsSelect :id="srSelectId" accent="brand" />
    </VtsInputWrapper>
    <VtsInputWrapper :label="t('network')" :message="t('import:ova-network-info')">
      <VtsSelect :id="networkSelectId" accent="brand" />
    </VtsInputWrapper>
    <VtsInputWrapper :label="t('name')" :message="t('import:ova-name-info')">
      <UiInput v-model.trim="name" accent="brand" :disabled="isBusy" />
    </VtsInputWrapper>

    <UiProgressBar
      v-if="uploadProgress !== undefined"
      accent="info"
      :fill-width="`${uploadProgress}%`"
      :legend="{ label: t('import:ova-uploading'), value: `${uploadProgress}%` }"
    />

    <div>
      <UiButton
        accent="brand"
        variant="primary"
        size="medium"
        left-icon="fa:file"
        :disabled="!canImport"
        :busy="isBusy"
        @click="importOva()"
      >
        {{ t('action:import-vm') }}
      </UiButton>
    </div>
  </UiCard>
</template>

<script setup lang="ts">
import { isOvaFile, ovaImportEndpoint, uploadFileWithProgress } from '@/modules/import/utils/import.util.ts'
import { useXoNetworkCollection } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import { useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useXoSrCollection } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { toErrorMessage } from '@/modules/system/utils/system.util.ts'
import type { FrontXoTask } from '@/modules/task/remote-resources/use-xo-task-collection.ts'
import { useXoTaskUtils } from '@/shared/composables/xo-task-utils.composable.ts'
import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsSelect from '@core/components/select/VtsSelect.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiInput from '@core/components/ui/input/UiInput.vue'
import UiProgressBar from '@core/components/ui/progress-bar/UiProgressBar.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useFormSelect } from '@core/packages/form-select'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const { pools } = useXoPoolCollection()
const { srs } = useXoSrCollection()
const { networks } = useXoNetworkCollection()
const { monitorTask } = useXoTaskUtils()

const file = ref<File>()
const poolId = ref<string>()
const srId = ref<string>()
const networkId = ref<string>()
const name = ref('')
/** percentage of the upload, undefined when no upload is running */
const uploadProgress = ref<number>()
const isBusy = ref(false)
const importedVmId = ref<string>()
const message = ref<{ accent: 'info' | 'success' | 'danger'; content: string }>()

const inPool = <T extends { $pool: string }>(objects: T[]) => objects.filter(object => object.$pool === poolId.value)

const { id: poolSelectId } = useFormSelect(pools, {
  model: poolId,
  required: true,
  searchable: true,
  disabled: isBusy,
  option: { label: 'name_label', value: pool => pool.id as string },
})

const { id: srSelectId } = useFormSelect(
  computed(() => inPool(srs.value).filter(sr => sr.content_type !== 'iso')),
  {
    model: srId,
    required: true,
    searchable: true,
    disabled: isBusy,
    option: { label: 'name_label', value: sr => sr.id as string },
  }
)

// without a choice, the server connects the network interfaces to the management network of the pool
const { id: networkSelectId } = useFormSelect(
  computed(() => inPool(networks.value)),
  {
    model: networkId,
    searchable: true,
    disabled: isBusy,
    emptyOption: () => ({ label: t('import:ova-management-network'), value: undefined }),
    option: { label: 'name_label', value: network => network.id as string },
  }
)

// the targets belong to the pool
watch(poolId, () => {
  srId.value = undefined
  networkId.value = undefined
})

const canImport = computed(
  () => file.value !== undefined && isOvaFile(file.value.name) && poolId.value !== undefined && srId.value !== undefined
)

function onFileChange(event: Event) {
  file.value = (event.target as HTMLInputElement).files?.[0]
  message.value = undefined
  importedVmId.value = undefined
}

async function importOva() {
  const ova = file.value
  if (ova === undefined || poolId.value === undefined || srId.value === undefined) {
    return
  }
  isBusy.value = true
  message.value = undefined
  importedVmId.value = undefined
  uploadProgress.value = 0
  try {
    const endpoint = ovaImportEndpoint(poolId.value, {
      sr: srId.value,
      network: networkId.value,
      nameLabel: name.value,
      fileName: ova.name,
    })
    const { taskId } = await uploadFileWithProgress<{ taskId: FrontXoTask['id'] }>(endpoint, ova, progress => {
      uploadProgress.value = progress.total > 0 ? Math.floor((progress.loaded / progress.total) * 100) : 0
    })
    uploadProgress.value = undefined
    message.value = { accent: 'info', content: t('import:ova-converting') }

    const { id } = await monitorTask<{ id: string }>(taskId)
    importedVmId.value = id
    message.value = { accent: 'success', content: t('import:file-done', { name: ova.name }) }
  } catch (error) {
    message.value = { accent: 'danger', content: toErrorMessage(error) }
  } finally {
    uploadProgress.value = undefined
    isBusy.value = false
  }
}
</script>

<style scoped lang="postcss">
.description {
  color: var(--color-neutral-txt-secondary);
}
</style>
