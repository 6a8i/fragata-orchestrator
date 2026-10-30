<template>
  <UiHeadBar>
    {{ vm.name_label }}
    <template #icon>
      <VtsObjectIcon
        size="medium"
        :state="toLower(vm.power_state)"
        type="vm"
        :busy="isChangingState"
        :busy-tooltip="currentOperation"
      />
    </template>
    <template #actions>
      <MenuList placement="bottom-start">
        <template #trigger="{ open }">
          <UiDropdownButton @click="open($event)">{{ t('action:change-state') }}</UiDropdownButton>
        </template>
        <VmPowerStateActions :vm />
      </MenuList>
      <MenuList placement="bottom-end">
        <template #trigger="{ open }">
          <UiButtonIcon
            v-tooltip="{
              placement: 'left',
              content: t('more-actions'),
            }"
            icon="action:more-actions"
            accent="brand"
            size="medium"
            @click="open($event)"
          />
        </template>
        <VmMoreActions :vm />
      </MenuList>
    </template>
  </UiHeadBar>
  <TabList>
    <RouterLink v-slot="{ isActive, href }" :to="{ name: '/vm/[id]/dashboard', params: { id: vm.id } }" custom>
      <UiTabItem :active="isActive" :href tag="a">
        {{ t('dashboard') }}
      </UiTabItem>
    </RouterLink>
    <RouterLink v-slot="{ isActive, href }" :to="{ name: '/vm/[id]/console', params: { id: vm.id } }" custom>
      <UiTabItem :active="isActive" :href tag="a">
        {{ t('console') }}
      </UiTabItem>
    </RouterLink>
    <RouterLink v-slot="{ isActive, href }" :to="{ name: '/vm/[id]/backups', params: { id: vm.id } }" custom>
      <UiTabItem :active="isActive" :href tag="a">
        {{ t('backups') }}
      </UiTabItem>
    </RouterLink>
    <RouterLink v-slot="{ isActive, href }" :to="{ name: '/vm/[id]/system', params: { id: vm.id } }" custom>
      <UiTabItem :active="isActive" :href tag="a">
        {{ t('system') }}
      </UiTabItem>
    </RouterLink>
    <RouterLink v-slot="{ isActive, href }" :to="{ name: '/vm/[id]/networks', params: { id: vm.id } }" custom>
      <UiTabItem :active="isActive" :href tag="a">
        {{ t('network') }}
      </UiTabItem>
    </RouterLink>
    <RouterLink v-slot="{ isActive, href }" :to="{ name: '/vm/[id]/vdis', params: { id: vm.id } }" custom>
      <UiTabItem :active="isActive" :href tag="a">
        {{ t('vdis') }}
      </UiTabItem>
    </RouterLink>
    <RouterLink v-slot="{ isActive, href }" :to="{ name: `/vm/[id]/snapshots`, params: { id: vm.id } }" custom>
      <UiTabItem :active="isActive" :href tag="a">
        {{ t('snapshots') }}
      </UiTabItem>
    </RouterLink>
    <RouterLink v-slot="{ isActive, href }" :to="{ name: '/vm/[id]/tasks', params: { id: vm.id } }" custom>
      <UiTabItem :active="isActive" :href tag="a">
        {{ t('tasks') }}
      </UiTabItem>
    </RouterLink>
  </TabList>
</template>

<script lang="ts" setup>
import VmMoreActions from '@/modules/vm/components/actions/VmMoreActions.vue'
import VmPowerStateActions from '@/modules/vm/components/actions/VmPowerStateActions.vue'
import { useXoVmUtils } from '@/modules/vm/composables/xo-vm-utils.composable.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import MenuList from '@core/components/menu/MenuList.vue'
import VtsObjectIcon from '@core/components/object-icon/VtsObjectIcon.vue'
import TabList from '@core/components/tab-list/TabList.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiDropdownButton from '@core/components/ui/dropdown-button/UiDropdownButton.vue'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import UiTabItem from '@core/components/ui/tab-item/UiTabItem.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { toLower } from 'lodash-es'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{ vm: FrontXoVm }>()

const { t } = useI18n()

const { isChangingState, currentOperation } = useXoVmUtils(() => vm)
</script>
