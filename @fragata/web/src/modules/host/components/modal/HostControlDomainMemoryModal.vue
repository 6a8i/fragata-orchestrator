<template>
  <UiModal accent="warning" icon="status:warning-picto" @confirm="handleConfirm()" @dismiss="emit('cancel')">
    <template #title>
      {{ t('modal:host-control-domain-memory-title', { name: host.name_label }) }}
    </template>

    <template #content>
      <div class="host-dom0-memory-form">
        <p>{{ t('modal:host-control-domain-memory-description') }}</p>
        <VtsInputWrapper :label="`${t('control-domain-memory')} (GiB)`" :message="error">
          <UiInput v-model="memoryGib" type="number" accent="brand" required />
        </VtsInputWrapper>
      </div>
    </template>

    <template #buttons>
      <VtsOverlayCancelButton @click="emit('cancel')" />
      <VtsOverlayConfirmButton>{{ t('action:apply-and-reboot') }}</VtsOverlayConfirmButton>
    </template>
  </UiModal>
</template>

<script lang="ts" setup>
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import UiInput from '@core/components/ui/input/UiInput.vue'
import UiModal from '@core/components/ui/modal/UiModal.vue'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  host: FrontXoHost
}>()

const emit = defineEmits<{
  confirm: [memory: number]
  cancel: []
}>()

const { t } = useI18n()

const GIB = 1024 ** 3

const memoryGib = ref<number | ''>(4)
const submitted = ref(false)

const isValid = computed(() => Number(memoryGib.value) > 0)

const error = computed<InputWrapperMessage | undefined>(() =>
  submitted.value && !isValid.value
    ? { content: t('job:host-control-domain-memory:invalid'), accent: 'danger' }
    : undefined
)

function handleConfirm() {
  submitted.value = true

  if (isValid.value) {
    emit('confirm', Math.round(Number(memoryGib.value) * GIB))
  }
}
</script>

<style lang="postcss" scoped>
.host-dom0-memory-form {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
  text-align: left;
}
</style>
