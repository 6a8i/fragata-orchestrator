<template>
  <MenuItem
    v-tooltip="!canEditVm && editVmErrorMessage"
    accent="neutral"
    icon="action:edit"
    :disabled="!canEditVm"
    :busy="isEditingVm"
    @click="edit()"
  >
    {{ t('action:edit-settings') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import { useVmSettingsDrawer } from '@/modules/vm/composables/use-vm-settings-drawer.composable.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { IK_CLOSE_MENU } from '@core/utils/injection-keys.util.ts'
import { inject } from 'vue'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: FrontXoVm
}>()

const { t } = useI18n()

const { openVmSettingsDrawer, canEditVm, isEditingVm, editVmErrorMessage } = useVmSettingsDrawer(() => vm)

const closeMenu = inject(IK_CLOSE_MENU, undefined)

function edit() {
  closeMenu?.()
  openVmSettingsDrawer()
}
</script>
