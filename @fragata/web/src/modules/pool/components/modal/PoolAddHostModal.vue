<template>
  <UiModal accent="warning" icon="status:warning-picto" @confirm="handleConfirm()" @dismiss="emit('cancel')">
    <template #title>
      {{ t('modal:pool-add-host-title', { name: pool.name_label }) }}
    </template>

    <template #content>
      <div class="pool-add-host-form">
        <p>{{ t('modal:pool-add-host-description') }}</p>
        <VtsInputWrapper :label="t('host')" :message="error">
          <VtsSelect :id="hostSelectId" accent="brand" />
        </VtsInputWrapper>
        <VtsStateHero v-if="candidates.length === 0" type="no-data" format="card" horizontal size="extra-small">
          {{ t('pool-add-host:no-candidate') }}
        </VtsStateHero>
      </div>
    </template>

    <template #buttons>
      <VtsOverlayCancelButton @click="emit('cancel')" />
      <VtsOverlayConfirmButton>{{ t('action:add-host') }}</VtsOverlayConfirmButton>
    </template>
  </UiModal>
</template>

<script lang="ts" setup>
import { useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import type { InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import VtsSelect from '@core/components/select/VtsSelect.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiModal from '@core/components/ui/modal/UiModal.vue'
import { useFormSelect } from '@core/packages/form-select'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { pool } = defineProps<{
  pool: FrontXoPool
}>()

const emit = defineEmits<{
  confirm: [hostId: string]
  cancel: []
}>()

const { t } = useI18n()

const { hosts, hostsByPool } = useXoHostCollection()

// only the host of a single-host pool can join: its pool is merged into this one
const candidates = computed(() =>
  hosts.value.filter(
    host =>
      host.$pool !== pool.id && host.power_state === 'Running' && (hostsByPool.value.get(host.$pool)?.length ?? 0) === 1
  )
)

const hostId = ref<string>()
const submitted = ref(false)

const { id: hostSelectId } = useFormSelect(candidates, {
  model: hostId,
  required: true,
  searchable: true,
  option: {
    id: host => host.id,
    value: host => host.id as string,
    label: host => `${host.name_label} (${host.address})`,
  },
})

const error = computed<InputWrapperMessage | undefined>(() =>
  submitted.value && hostId.value === undefined ? { content: t('job:arg:host-required'), accent: 'danger' } : undefined
)

function handleConfirm() {
  submitted.value = true

  if (hostId.value !== undefined) {
    emit('confirm', hostId.value)
  }
}
</script>

<style lang="postcss" scoped>
.pool-add-host-form {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
  text-align: left;
}
</style>
