<template>
  <MenuItem v-if="showChangeState" accent="brand" icon="action:change-state">
    {{ t('action:change-state') }}
    <template #submenu>
      <VmPowerStateActions :vm />
    </template>
  </MenuItem>
  <VmEditSettingsButton :vm />
  <VmMigrateButton :vm />
  <VmSnapshotButton :vm />
  <VmDuplicateButton :vm />
  <VmExportButton :vm />
  <VmCdButtons :vm />
  <VmConvertToTemplateButton :vm />
  <MenuSeparator />
  <VmDeleteButton :vm />
</template>

<script lang="ts" setup>
import VmCdButtons from '@/modules/vm/components/actions/cd/VmCdButtons.vue'
import VmDeleteButton from '@/modules/vm/components/actions/delete/VmDeleteButton.vue'
import VmEditSettingsButton from '@/modules/vm/components/actions/edit/VmEditSettingsButton.vue'
import VmDuplicateButton from '@/modules/vm/components/actions/duplicate/VmDuplicateButton.vue'
import VmExportButton from '@/modules/vm/components/actions/export/VmExportButton.vue'
import VmMigrateButton from '@/modules/vm/components/actions/migrate/VmMigrateButton.vue'
import VmSnapshotButton from '@/modules/vm/components/actions/snapshot/VmSnapshotButton.vue'
import VmConvertToTemplateButton from '@/modules/vm/components/actions/template/VmConvertToTemplateButton.vue'
import VmPowerStateActions from '@/modules/vm/components/actions/VmPowerStateActions.vue'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import MenuSeparator from '@core/components/menu/MenuSeparator.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  vm: FrontXoVm
  showChangeState?: boolean
}>()

const { t } = useI18n()
</script>
