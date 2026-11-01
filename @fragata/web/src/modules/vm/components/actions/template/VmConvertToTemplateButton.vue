<template>
  <MenuItem
    v-tooltip="!canRun && errorMessage"
    accent="neutral"
    icon="object:template"
    :disabled="!canRun"
    :busy="isRunning"
    @click="confirmConversion()"
  >
    {{ t('action:convert-to-template') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import { useXoVmConvertToTemplateJob } from '@/modules/vm/jobs/xo-vm-convert-to-template.job.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { useTypeToConfirmModal } from '@core/composables/modals/use-type-to-confirm-modal.ts'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { IK_CLOSE_MENU } from '@core/utils/injection-keys.util.ts'
import { inject } from 'vue'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: FrontXoVm
}>()

const { t } = useI18n()

const { run, canRun, isRunning, errorMessage } = useXoVmConvertToTemplateJob(() => vm)

const closeMenu = inject(IK_CLOSE_MENU, undefined)

const { open: openTypeToConfirmModal } = useTypeToConfirmModal()

function confirmConversion() {
  closeMenu?.()

  return openTypeToConfirmModal({
    props: {
      accent: 'warning',
      icon: 'status:warning-picto',
      title: t('modal:convert-to-template-title', { name: vm.name_label }),
      description: t('modal:convert-to-template-description'),
      confirmationText: vm.name_label,
      confirmLabel: t('action:convert-to-template'),
    },
    events: {
      onConfirm: () => run({ detached: true }),
    },
  })
}
</script>
