<template>
  <div v-if="cloudConfigs.length > 0" class="cloud-config-template-picker">
    <VtsInputWrapper :label="t('cloud-configs:load-template')" :message="t('cloud-configs:load-template-info')">
      <VtsSelect :id="selectId" accent="brand" />
    </VtsInputWrapper>
  </div>
</template>

<script setup lang="ts">
import type { CloudConfig } from '@/modules/system/components/modal/CloudConfigModal.vue'
import { fetchGet } from '@/shared/utils/fetch.util.ts'
import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsSelect from '@core/components/select/VtsSelect.vue'
import { useFormSelect } from '@core/packages/form-select'
import { onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const userConfig = defineModel<string>('userConfig', { required: true })
const networkConfig = defineModel<string>('networkConfig', { required: true })

const { t } = useI18n()

const cloudConfigs = ref<CloudConfig[]>([])
const selectedId = ref<string>()

onMounted(async () => {
  try {
    cloudConfigs.value = await fetchGet<CloudConfig[]>('cloud-configs')
  } catch {
    // the templates are readable by administrators only: the picker stays hidden for the other users
  }
})

const { id: selectId } = useFormSelect(cloudConfigs, {
  model: selectedId,
  searchable: true,
  placeholder: () => t('cloud-configs:choose-template'),
  option: {
    id: config => config.id,
    value: config => config.id,
    label: config =>
      `${config.name} (${config.type === 'network' ? t('cloud-configs:network') : t('cloud-configs:user-data')})`,
  },
})

watch(selectedId, id => {
  const config = cloudConfigs.value.find(candidate => candidate.id === id)
  if (config === undefined) {
    return
  }
  if (config.type === 'network') {
    networkConfig.value = config.template
  } else {
    userConfig.value = config.template
  }
})
</script>

<style scoped lang="postcss">
.cloud-config-template-picker {
  margin-block-end: 1.6rem;
}
</style>
