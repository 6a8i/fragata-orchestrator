<template>
  <UiModal accent="info" icon="fa:shield-halved" @confirm="handleConfirm()" @dismiss="emit('cancel')">
    <template #title>
      {{ t('modal:pool-enable-ha-title', { name: pool.name_label }) }}
    </template>

    <template #content>
      <div class="pool-enable-ha-form">
        <p>{{ t('modal:pool-enable-ha-description') }}</p>
        <VtsInputWrapper :label="t('heartbeat-storage-repository')" :message="error">
          <VtsSelect :id="srSelectId" accent="brand" />
        </VtsInputWrapper>
      </div>
    </template>

    <template #buttons>
      <VtsOverlayCancelButton @click="emit('cancel')" />
      <VtsOverlayConfirmButton>{{ t('action:enable-ha') }}</VtsOverlayConfirmButton>
    </template>
  </UiModal>
</template>

<script lang="ts" setup>
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useXoSrCollection } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import type { InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import VtsSelect from '@core/components/select/VtsSelect.vue'
import UiModal from '@core/components/ui/modal/UiModal.vue'
import { useFormSelect } from '@core/packages/form-select'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { pool } = defineProps<{
  pool: FrontXoPool
}>()

const emit = defineEmits<{
  confirm: [heartbeatSrIds: string[]]
  cancel: []
}>()

const { t } = useI18n()

const { srsByPool } = useXoSrCollection()

// the heartbeat needs a storage every host can reach
const sharedSrs = computed(() =>
  (srsByPool.value.get(pool.id) ?? []).filter(sr => sr.shared && sr.content_type !== 'iso' && sr.SR_type !== 'iso')
)

const srIds = ref<string[]>([])
const submitted = ref(false)

const { id: srSelectId } = useFormSelect(sharedSrs, {
  model: srIds,
  multiple: true,
  searchable: true,
  option: {
    id: sr => sr.id,
    value: sr => sr.id as string,
    label: sr => sr.name_label,
  },
})

const error = computed<InputWrapperMessage | undefined>(() => {
  if (sharedSrs.value.length === 0) {
    return { content: t('pool-ha:no-shared-sr'), accent: 'warning' }
  }

  return submitted.value && srIds.value.length === 0
    ? { content: t('job:pool-ha:heartbeat-sr-required'), accent: 'danger' }
    : undefined
})

function handleConfirm() {
  submitted.value = true

  if (srIds.value.length > 0) {
    emit('confirm', [...srIds.value])
  }
}
</script>

<style lang="postcss" scoped>
.pool-enable-ha-form {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
  text-align: left;
}
</style>
