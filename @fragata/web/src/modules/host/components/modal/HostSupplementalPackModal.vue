<template>
  <UiModal accent="info" icon="fa:compact-disc" @confirm="handleConfirm()" @dismiss="emit('cancel')">
    <template #title>
      {{ t('modal:host-supplemental-pack-title', { name: host.name_label }) }}
    </template>

    <template #content>
      <div class="host-supplemental-pack-form">
        <p>{{ t('modal:host-supplemental-pack-description') }}</p>
        <input class="file-input" type="file" accept=".iso" @change="onFileChange($event)" />
        <UiInfo v-if="submitted && file === undefined" accent="danger">
          {{ t('job:host-supplemental-pack:file-required') }}
        </UiInfo>
      </div>
    </template>

    <template #buttons>
      <VtsOverlayCancelButton @click="emit('cancel')" />
      <VtsOverlayConfirmButton>{{ t('action:install') }}</VtsOverlayConfirmButton>
    </template>
  </UiModal>
</template>

<script lang="ts" setup>
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiModal from '@core/components/ui/modal/UiModal.vue'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  host: FrontXoHost
}>()

const emit = defineEmits<{
  confirm: [file: File]
  cancel: []
}>()

const { t } = useI18n()

const file = ref<File>()
const submitted = ref(false)

function onFileChange(event: Event) {
  file.value = (event.target as HTMLInputElement).files?.[0]
}

function handleConfirm() {
  submitted.value = true

  if (file.value !== undefined) {
    emit('confirm', file.value)
  }
}
</script>

<style lang="postcss" scoped>
.host-supplemental-pack-form {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
  text-align: left;
}
</style>
