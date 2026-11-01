<template>
  <VtsSidePanel :has-selection="!!backupArchive" @close="emit('close')">
    <template v-if="backupArchive" #actions>
      <BackupArchiveActions :backup-archive />
    </template>

    <template v-if="backupArchive" #default>
      <UiPanelCard>
        <UiPanelCardTitle size="medium" :label="t('backup-archive')" />
        <VtsCardRowKeyValue>
          <template #key>{{ t('vm') }}</template>
          <template #value>{{ backupArchive.vm.name_label }}</template>
          <template #addons>
            <VtsCopyButton :value="backupArchive.vm.name_label" />
          </template>
        </VtsCardRowKeyValue>
        <VtsCardRowKeyValue>
          <template #key>{{ t('vm-uuid') }}</template>
          <template #value>{{ backupArchive.vm.uuid }}</template>
          <template #addons>
            <VtsCopyButton :value="backupArchive.vm.uuid" />
          </template>
        </VtsCardRowKeyValue>
        <VtsCardRowKeyValue>
          <template #key>{{ t('date') }}</template>
          <template #value>{{ new Date(backupArchive.timestamp).toLocaleString() }}</template>
        </VtsCardRowKeyValue>
        <VtsCardRowKeyValue>
          <template #key>{{ t('mode') }}</template>
          <template #value>{{ backupArchive.mode === 'delta' ? t('incremental') : t('full') }}</template>
        </VtsCardRowKeyValue>
        <VtsCardRowKeyValue>
          <template #key>{{ t('backup-repository') }}</template>
          <template #value>{{ backupRepository?.name ?? backupArchive.backupRepository }}</template>
        </VtsCardRowKeyValue>
        <VtsCardRowKeyValue>
          <template #key>{{ t('size-on-disk') }}</template>
          <template #value>{{ `${size.value} ${size.prefix}` }}</template>
        </VtsCardRowKeyValue>
        <VtsCardRowKeyValue>
          <template #key>{{ t('disks') }}</template>
          <template #value>{{ backupArchive.disks.length }}</template>
        </VtsCardRowKeyValue>
        <VtsCardRowKeyValue>
          <template #key>{{ t('with-memory') }}</template>
          <template #value>{{ backupArchive.withMemory ? t('yes') : t('no') }}</template>
        </VtsCardRowKeyValue>
        <VtsCardRowKeyValue>
          <template #key>{{ t('id') }}</template>
          <template #value>{{ backupArchive.id }}</template>
          <template #addons>
            <VtsCopyButton :value="backupArchive.id" />
          </template>
        </VtsCardRowKeyValue>
      </UiPanelCard>
    </template>
  </VtsSidePanel>
</template>

<script lang="ts" setup>
import BackupArchiveActions from '@/modules/backup-archive/components/actions/BackupArchiveActions.vue'
import { useXoBackupRepositoryCollection } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import type { FrontXoVmBackupArchive } from '@/modules/vm/remote-resources/use-xo-vm-backup-archive-collection.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import VtsSidePanel from '@core/components/panel/VtsSidePanel.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import { formatSizeRaw } from '@core/utils/size.util.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { backupArchive } = defineProps<{
  backupArchive?: FrontXoVmBackupArchive
}>()

const emit = defineEmits<{
  close: []
}>()

const { t } = useI18n()

const { getBackupRepositoryById } = useXoBackupRepositoryCollection()

const backupRepository = computed(() =>
  backupArchive !== undefined ? getBackupRepositoryById(backupArchive.backupRepository) : undefined
)

const size = computed(() => formatSizeRaw(backupArchive?.size ?? 0, 1))
</script>
