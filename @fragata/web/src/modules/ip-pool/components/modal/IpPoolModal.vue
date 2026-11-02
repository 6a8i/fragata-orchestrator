<template>
  <UiModal accent="info" icon="fa:network-wired" @confirm="handleConfirm()" @dismiss="emit('cancel')">
    <template #title>
      {{ ipPool === undefined ? t('action:new-ip-pool') : t('action:edit-ip-pool') }}
    </template>

    <template #content>
      <div class="ip-pool-form">
        <VtsInputWrapper :label="t('name')" :message="nameError">
          <UiInput v-model.trim="name" accent="brand" required />
        </VtsInputWrapper>
        <UiTextarea v-model="addressesText" accent="brand" placeholder="192.168.1.10-192.168.1.50">
          {{ t('ip-addresses') }}
          <template #info>{{ t('ip-pool:addresses-hint') }}</template>
        </UiTextarea>
        <VtsInputWrapper :label="t('networks')">
          <VtsSelect :id="networkSelectId" accent="brand" />
        </VtsInputWrapper>
      </div>
    </template>

    <template #buttons>
      <VtsOverlayCancelButton @click="emit('cancel')" />
      <VtsOverlayConfirmButton>{{ t('action:save') }}</VtsOverlayConfirmButton>
    </template>
  </UiModal>
</template>

<script lang="ts" setup>
import type { IpPoolPayload } from '@/modules/ip-pool/jobs/xo-ip-pool.jobs.ts'
import type { FrontXoIpPool } from '@/modules/ip-pool/remote-resources/use-xo-ip-pool-collection.ts'
import { collapseAddresses, parseAddressEntries } from '@/modules/ip-pool/utils/ip-pool-addresses.util.ts'
import { useXoNetworkCollection } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import { useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import type { InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import VtsSelect from '@core/components/select/VtsSelect.vue'
import UiInput from '@core/components/ui/input/UiInput.vue'
import UiModal from '@core/components/ui/modal/UiModal.vue'
import UiTextarea from '@core/components/ui/text-area/UiTextarea.vue'
import { useFormSelect } from '@core/packages/form-select'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { ipPool } = defineProps<{
  ipPool?: FrontXoIpPool
}>()

const emit = defineEmits<{
  confirm: [payload: IpPoolPayload]
  cancel: []
}>()

const { t } = useI18n()

const { networks } = useXoNetworkCollection()
const { getPoolById } = useXoPoolCollection()

const name = ref(ipPool?.name ?? '')
const addressesText = ref(collapseAddresses(ipPool?.addresses ?? []).join('\n'))
const networkIds = ref<string[]>([...(ipPool?.networks ?? [])])
const submitted = ref(false)

const { id: networkSelectId } = useFormSelect(networks, {
  model: networkIds,
  multiple: true,
  searchable: true,
  option: {
    id: network => network.id,
    value: network => network.id as string,
    label: network => {
      const pool = getPoolById(network.$pool)
      return pool === undefined ? network.name_label : `${network.name_label} (${pool.name_label})`
    },
  },
})

const nameError = computed<InputWrapperMessage | undefined>(() =>
  submitted.value && name.value === '' ? { content: t('job:arg:name-required'), accent: 'danger' } : undefined
)

function handleConfirm() {
  submitted.value = true

  if (name.value === '') {
    return
  }

  emit('confirm', {
    name: name.value,
    addresses: parseAddressEntries(addressesText.value),
    networks: [...networkIds.value],
  })
}
</script>

<style lang="postcss" scoped>
.ip-pool-form {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
  text-align: left;
}
</style>
