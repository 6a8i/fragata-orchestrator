<template>
  <UiCard>
    <UiTitle>{{ t('import:vmware') }}</UiTitle>
    <p class="description">{{ t('import:vmware-description') }}</p>
    <UiAlert v-if="message !== undefined" :accent="message.accent">{{ message.content }}</UiAlert>

    <VtsInputWrapper :label="t('pool')">
      <VtsSelect :id="poolSelectId" accent="brand" />
    </VtsInputWrapper>
    <div class="connection">
      <VtsInputWrapper :label="t('import:vmware-host')">
        <UiInput v-model.trim="connection.host" accent="brand" />
      </VtsInputWrapper>
      <VtsInputWrapper :label="t('username')">
        <UiInput v-model.trim="connection.user" accent="brand" />
      </VtsInputWrapper>
      <VtsInputWrapper :label="t('password')">
        <UiInput v-model="connection.password" type="password" accent="brand" />
      </VtsInputWrapper>
    </div>
    <UiCheckbox v-model="skipSslVerify" accent="brand">{{ t('server:allow-unauthorized') }}</UiCheckbox>
    <div>
      <UiButton
        accent="brand"
        variant="secondary"
        size="medium"
        :disabled="!canConnect"
        :busy="isListing"
        @click="listVms()"
      >
        {{ t('action:list-vms') }}
      </UiButton>
    </div>

    <template v-if="esxiVms !== undefined">
      <UiCardSubtitle>{{ t('import:vms-to-import') }}</UiCardSubtitle>
      <div v-for="vm of esxiVms" :key="vm.id" class="row">
        <UiCheckbox v-model="selectedVmIds" :value="vm.id" accent="brand" :disabled="!vm.hasAllExtentsListed">
          {{ vm.nameLabel }}
        </UiCheckbox>
        <span class="sublabel typo-body-regular-small">
          {{ vmSummary(vm) }}
        </span>
        <UiInfo v-if="!vm.hasAllExtentsListed" accent="warning">{{ t('import:vmware-disk-unreadable') }}</UiInfo>
      </div>
      <VtsStateHero v-if="esxiVms.length === 0" type="no-data" format="card" horizontal size="extra-small">
        {{ t('import:no-vmware-vm') }}
      </VtsStateHero>

      <VtsInputWrapper :label="t('storage-repository')">
        <VtsSelect :id="srSelectId" accent="brand" />
      </VtsInputWrapper>
      <VtsInputWrapper :label="t('network')">
        <VtsSelect :id="networkSelectId" accent="brand" />
      </VtsInputWrapper>
      <VtsInputWrapper :label="t('template')" :message="t('import:template-info')">
        <VtsSelect :id="templateSelectId" accent="brand" />
      </VtsInputWrapper>
      <UiCheckbox v-model="stopSource" accent="brand">{{ t('import:stop-source') }}</UiCheckbox>
      <div>
        <UiButton
          accent="brand"
          variant="primary"
          size="medium"
          :disabled="!canImport"
          :busy="isImporting"
          @click="importVms()"
        >
          {{ t('action:import-n-vms', { n: selectedVmIds.length }) }}
        </UiButton>
      </div>
    </template>
  </UiCard>
</template>

<script setup lang="ts">
import { useXoNetworkCollection } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import { useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useXoSrCollection } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { toErrorMessage } from '@/modules/system/utils/system.util.ts'
import { useXoVmTemplateCollection } from '@/modules/vm/remote-resources/use-xo-vm-template-collection.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsSelect from '@core/components/select/VtsSelect.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardSubtitle from '@core/components/ui/card-subtitle/UiCardSubtitle.vue'
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiInput from '@core/components/ui/input/UiInput.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useFormSelect } from '@core/packages/form-select'
import { formatSize as formatBytes } from '@core/utils/size.util.ts'
import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

type EsxiVm = {
  id: string
  nameLabel: string
  memory: number
  nCpus: number
  powerState: string
  hasAllExtentsListed: boolean
  storage: { used: number; free: number }
}

const { t } = useI18n()

const { pools } = useXoPoolCollection()
const { srs } = useXoSrCollection()
const { networks } = useXoNetworkCollection()
const { templates } = useXoVmTemplateCollection()

const poolId = ref<string>()
const connection = reactive({ host: '', user: 'root', password: '' })
const skipSslVerify = ref(false)
const esxiVms = ref<EsxiVm[]>()
const selectedVmIds = ref<string[]>([])
const srId = ref<string>()
const networkId = ref<string>()
const templateId = ref<string>()
const stopSource = ref(false)
const isListing = ref(false)
const isImporting = ref(false)
const message = ref<{ accent: 'success' | 'danger'; content: string }>()

const inPool = <T extends { $pool: string }>(objects: T[]) => objects.filter(object => object.$pool === poolId.value)

const { id: poolSelectId } = useFormSelect(pools, {
  model: poolId,
  required: true,
  searchable: true,
  option: { label: 'name_label', value: pool => pool.id as string },
})

const { id: srSelectId } = useFormSelect(
  computed(() => inPool(srs.value).filter(sr => sr.content_type !== 'iso')),
  { model: srId, required: true, searchable: true, option: { label: 'name_label', value: sr => sr.id as string } }
)

const { id: networkSelectId } = useFormSelect(
  computed(() => inPool(networks.value)),
  {
    model: networkId,
    required: true,
    searchable: true,
    option: { label: 'name_label', value: network => network.id as string },
  }
)

const { id: templateSelectId } = useFormSelect(
  computed(() => inPool(templates.value)),
  {
    model: templateId,
    required: true,
    searchable: true,
    option: { label: 'name_label', value: template => template.id as string },
  }
)

// the targets belong to the pool
watch(poolId, () => {
  srId.value = undefined
  networkId.value = undefined
  templateId.value = undefined
})

const formatSize = (bytes: number) => formatBytes(bytes, 1)

const vmSummary = (vm: EsxiVm) =>
  [`${vm.nCpus} vCPU`, formatSize(vm.memory), formatSize(vm.storage.used), vm.powerState].join(' · ')

const canConnect = computed(
  () => poolId.value !== undefined && connection.host !== '' && connection.user !== '' && connection.password !== ''
)

const canImport = computed(
  () =>
    canConnect.value &&
    selectedVmIds.value.length > 0 &&
    srId.value !== undefined &&
    networkId.value !== undefined &&
    templateId.value !== undefined
)

const connectionBody = () => ({ ...connection, sslVerify: !skipSslVerify.value })

async function listVms() {
  isListing.value = true
  message.value = undefined
  try {
    esxiVms.value = await fetchPost<EsxiVm[]>(`pools/${poolId.value}/actions/list_esxi_vms`, connectionBody())
    selectedVmIds.value = []
  } catch (error) {
    message.value = { accent: 'danger', content: toErrorMessage(error) }
  } finally {
    isListing.value = false
  }
}

async function importVms() {
  isImporting.value = true
  message.value = undefined
  try {
    await fetchPost(`pools/${poolId.value}/actions/import_from_esxi`, {
      ...connectionBody(),
      vms: selectedVmIds.value,
      sr: srId.value,
      network: networkId.value,
      template: templateId.value,
      stopSource: stopSource.value,
    })
    message.value = { accent: 'success', content: t('import:started') }
    selectedVmIds.value = []
  } catch (error) {
    message.value = { accent: 'danger', content: toErrorMessage(error) }
  } finally {
    isImporting.value = false
  }
}
</script>

<style scoped lang="postcss">
.description,
.sublabel {
  color: var(--color-neutral-txt-secondary);
}

.connection {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.8rem;
}

.row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.8rem;
  padding-block: 0.4rem;
}
</style>
