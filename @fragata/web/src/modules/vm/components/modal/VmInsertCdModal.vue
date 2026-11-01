<template>
  <UiModal accent="info" icon="fa:compact-disc" @confirm="handleConfirm()" @dismiss="emit('cancel')">
    <template #title>
      {{ t('modal:insert-cd-title', { name: vm.name_label }) }}
    </template>

    <template #content>
      <div class="insert-cd-form">
        <VtsInputWrapper :label="t('iso')" :message="error">
          <VtsSelect :id="vdiSelectId" accent="brand" />
        </VtsInputWrapper>
      </div>
    </template>

    <template #buttons>
      <VtsOverlayCancelButton @click="emit('cancel')" />
      <VtsOverlayConfirmButton>{{ t('action:insert-cd') }}</VtsOverlayConfirmButton>
    </template>
  </UiModal>
</template>

<script lang="ts" setup>
import { useXoSrCollection } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import type { InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import VtsSelect from '@core/components/select/VtsSelect.vue'
import UiModal from '@core/components/ui/modal/UiModal.vue'
import { useFormSelect } from '@core/packages/form-select'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  vm: FrontXoVm
}>()

const emit = defineEmits<{
  confirm: [vdiId: FrontXoVdi['id']]
  cancel: []
}>()

const { t } = useI18n()

const { vdiIsosBySrName } = useXoSrCollection()

const isos = computed(() =>
  Object.entries(vdiIsosBySrName.value).flatMap(([srName, vdis]) => vdis.map(vdi => ({ vdi, srName })))
)

const vdiId = ref<FrontXoVdi['id']>()
const submitted = ref(false)

const { id: vdiSelectId } = useFormSelect(isos, {
  model: vdiId,
  required: true,
  searchable: true,
  option: {
    id: iso => iso.vdi.id,
    value: iso => iso.vdi.id,
    label: iso => `[${iso.srName}] ${iso.vdi.name_label}`,
  },
})

const error = computed<InputWrapperMessage | undefined>(() =>
  submitted.value && vdiId.value === undefined
    ? { content: t('job:vm-insert-cd:iso-required'), accent: 'danger' }
    : undefined
)

function handleConfirm() {
  submitted.value = true

  if (vdiId.value !== undefined) {
    emit('confirm', vdiId.value)
  }
}
</script>

<style lang="postcss" scoped>
.insert-cd-form {
  text-align: left;
}
</style>
