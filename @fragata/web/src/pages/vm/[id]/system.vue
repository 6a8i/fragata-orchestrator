<template>
  <div class="system-actions">
    <UiButton accent="brand" variant="secondary" size="medium" left-icon="action:edit" @click="openVmSettingsDrawer()">
      {{ t('action:edit-settings') }}
    </UiButton>
  </div>
  <VtsColumns extra-space-around>
    <VtsColumn>
      <VmSystemGeneralInfo :vm />
      <VmSystemNetworking :vm />
      <VmSystemStorageConfig :vm />
      <VmSystemResource :vm />
    </VtsColumn>
    <VtsColumn>
      <VmSystemVirtualizationAndBoot :vm />
      <VmSystemManagement :vm />
      <VmSystemGraphics :vm />
    </VtsColumn>
  </VtsColumns>
</template>

<script setup lang="ts">
import VmSystemGeneralInfo from '@/modules/vm/components/system/VmSystemGeneralInfo.vue'
import VmSystemGraphics from '@/modules/vm/components/system/VmSystemGraphics.vue'
import VmSystemManagement from '@/modules/vm/components/system/VmSystemManagement.vue'
import VmSystemNetworking from '@/modules/vm/components/system/VmSystemNetworking.vue'
import VmSystemResource from '@/modules/vm/components/system/VmSystemResource.vue'
import VmSystemStorageConfig from '@/modules/vm/components/system/VmSystemStorageConfig.vue'
import VmSystemVirtualizationAndBoot from '@/modules/vm/components/system/VmSystemVirtualizationAndBoot.vue'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import VtsColumn from '@core/components/column/VtsColumn.vue'
import VtsColumns from '@core/components/columns/VtsColumns.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import { useVmSettingsDrawer } from '@/modules/vm/composables/use-vm-settings-drawer.composable.ts'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{ vm: FrontXoVm }>()

const { t } = useI18n()

const { openVmSettingsDrawer } = useVmSettingsDrawer(() => vm)
</script>

<style scoped lang="postcss">
.system-actions {
  display: flex;
  justify-content: flex-end;
  padding: 0.8rem 0.8rem 0;
}
</style>
