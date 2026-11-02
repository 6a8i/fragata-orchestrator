<template>
  <UiCard>
    <UiTitle>{{ t('metadata-backups') }}</UiTitle>
    <UiAlert v-if="message !== undefined" :accent="message.accent">{{ message.content }}</UiAlert>

    <div v-for="backup of backups" :key="backup.id" class="row">
      <div class="label">
        <span>
          {{ backup.type === 'xo-config-backup' ? t('metadata-backup:xo-config') : poolLabel(backup) }}
        </span>
        <span class="sublabel typo-body-regular-small">
          {{ [new Date(backup.timestamp).toLocaleString(), backup.jobName].filter(Boolean).join(' · ') }}
        </span>
      </div>
      <UiButton
        accent="danger"
        variant="tertiary"
        size="small"
        :busy="busyId === backup.id"
        :disabled="busyId !== undefined"
        @click="confirmRestore(backup)"
      >
        {{ t('action:restore') }}
      </UiButton>
    </div>
    <VtsStateHero v-if="backups.length === 0" type="no-data" format="card" horizontal size="extra-small">
      {{ t('metadata-backups:none') }}
    </VtsStateHero>
  </UiCard>
</template>

<script setup lang="ts">
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import { toErrorMessage } from '@/modules/system/utils/system.util.ts'
import { fetchGet, fetchPost } from '@/shared/utils/fetch.util.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useTypeToConfirmModal } from '@core/composables/modals/use-type-to-confirm-modal.ts'
import { onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

type MetadataBackup = {
  id: string
  type: 'xo-config-backup' | 'xo-pool-metadata-backup'
  timestamp: number
  jobName?: string
  pool?: { uuid: string; name_label?: string }
  poolMaster?: { uuid: string; name_label?: string }
}

const { br } = defineProps<{
  br: FrontXoBackupRepository
}>()

const { t } = useI18n()

const backups = ref<MetadataBackup[]>([])
const busyId = ref<string>()
const message = ref<{ accent: 'success' | 'danger'; content: string }>()

// a pool without a name is shown by the name of its primary host
const poolLabel = (backup: MetadataBackup) =>
  t('metadata-backups:pool', {
    name: backup.pool?.name_label || backup.poolMaster?.name_label || backup.pool?.uuid || '',
  })

async function load() {
  try {
    backups.value = await fetchGet<MetadataBackup[]>(`backup-repositories/${br.id}/metadata_backups`)
  } catch (error) {
    message.value = { accent: 'danger', content: toErrorMessage(error) }
  }
}

onMounted(load)
watch(() => br.id, load)

async function restore(backup: MetadataBackup) {
  busyId.value = backup.id
  message.value = undefined
  try {
    await fetchPost(`backup-repositories/${br.id}/actions/restore_metadata`, { backupId: backup.id })
    message.value = { accent: 'success', content: t('metadata-backups:restored') }
  } catch (error) {
    message.value = { accent: 'danger', content: toErrorMessage(error) }
  } finally {
    busyId.value = undefined
  }
}

const { open: openTypeToConfirmModal } = useTypeToConfirmModal()

function confirmRestore(backup: MetadataBackup) {
  return openTypeToConfirmModal({
    props: {
      accent: 'danger',
      icon: 'status:danger-picto',
      title: t('modal:restore-metadata-title'),
      description:
        backup.type === 'xo-config-backup'
          ? t('modal:restore-xo-config-description')
          : t('modal:restore-pool-metadata-description'),
      confirmationText: 'restore',
      confirmLabel: t('action:restore'),
    },
    events: { onConfirm: () => restore(backup) },
  })
}
</script>

<style scoped lang="postcss">
.sublabel {
  color: var(--color-neutral-txt-secondary);
}

.row {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding-block: 0.4rem;

  .label {
    display: flex;
    flex: 1;
    flex-direction: column;
  }
}
</style>
