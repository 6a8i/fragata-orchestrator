<template>
  <UiModal accent="info" icon="action:migrate" @confirm="handleConfirm()" @dismiss="emit('cancel')">
    <template #title>{{ t('modal:warm-migrate-title', { name: vm.name_label }) }}</template>

    <template #content>
      <div class="warm-migrate-form">
        <p>{{ t('modal:warm-migrate-description') }}</p>
        <VtsInputWrapper :label="t('storage-repository')" :message="error">
          <VtsSelect :id="srSelectId" accent="brand" />
        </VtsInputWrapper>
        <UiCheckbox v-model="startDestinationVm" accent="brand">{{ t('warm-migrate:start-destination') }}</UiCheckbox>
        <UiCheckbox v-model="deleteSourceVm" accent="brand">{{ t('warm-migrate:delete-source') }}</UiCheckbox>
      </div>
    </template>

    <template #buttons>
      <VtsOverlayCancelButton @click="emit('cancel')" />
      <VtsOverlayConfirmButton>{{ t('action:warm-migrate') }}</VtsOverlayConfirmButton>
    </template>
  </UiModal>
</template>

<script lang="ts" setup>
import { useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useXoSrCollection } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import type { WarmMigratePayload } from '@/modules/vm/components/actions/warm-migrate/VmWarmMigrateButton.vue'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import type { InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import VtsSelect from '@core/components/select/VtsSelect.vue'
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'
import UiModal from '@core/components/ui/modal/UiModal.vue'
import { useFormSelect } from '@core/packages/form-select'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: FrontXoVm
}>()

const emit = defineEmits<{
  confirm: [payload: WarmMigratePayload]
  cancel: []
}>()

const { t } = useI18n()

const { srs } = useXoSrCollection()
const { getPoolById } = useXoPoolCollection()

const srId = ref<string>()
const startDestinationVm = ref(true)
const deleteSourceVm = ref(false)
const submitted = ref(false)

// SRs of the other pools: inside the pool, a live migration is enough
const candidates = computed(() => srs.value.filter(sr => sr.$pool !== vm.$pool && sr.content_type === 'user'))

const { id: srSelectId } = useFormSelect(candidates, {
  model: srId,
  required: true,
  searchable: true,
  option: {
    id: sr => sr.id,
    value: sr => sr.id as string,
    label: sr => `${sr.name_label} (${getPoolById(sr.$pool)?.name_label ?? sr.$pool})`,
  },
})

const error = computed<InputWrapperMessage | undefined>(() =>
  submitted.value && srId.value === undefined
    ? { content: t('target-storage-repository-required'), accent: 'danger' }
    : undefined
)

function handleConfirm() {
  submitted.value = true
  if (srId.value !== undefined) {
    emit('confirm', {
      srId: srId.value,
      startDestinationVm: startDestinationVm.value,
      deleteSourceVm: deleteSourceVm.value,
    })
  }
}
</script>

<style lang="postcss" scoped>
.warm-migrate-form {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
  text-align: left;
}
</style>
