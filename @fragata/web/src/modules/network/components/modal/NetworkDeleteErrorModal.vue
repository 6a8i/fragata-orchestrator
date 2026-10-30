<template>
  <VtsErrorModal :title="t('unable-to-delete-network')" @close="emit('close')">
    <template #content>
      {{ error ?? t('error') }}
      <template v-if="showConnectedVifsMessage">
        <br />
        {{ t('disconnect-vifs-to-delete-network') }}
      </template>
    </template>
  </VtsErrorModal>
</template>

<script lang="ts" setup>
import VtsErrorModal from '@core/components/modal/VtsErrorModal.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  error?: string
  showConnectedVifsMessage?: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const { t } = useI18n()
</script>
