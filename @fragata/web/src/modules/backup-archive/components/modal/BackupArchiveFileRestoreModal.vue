<template>
  <UiModal accent="info" icon="fa:folder-open" @confirm="download()" @dismiss="emit('cancel')">
    <template #title>
      {{ t('modal:restore-files-title', { name: backupArchive.vm.name_label }) }}
    </template>

    <template #content>
      <div class="file-restore">
        <UiAlert v-if="error !== undefined" accent="danger">{{ error }}</UiAlert>

        <VtsInputWrapper v-if="backupArchive.disks.length > 1" :label="t('disk')">
          <VtsSelect :id="diskSelectId" accent="brand" />
        </VtsInputWrapper>
        <VtsInputWrapper v-if="partitions.length > 1" :label="t('partition')">
          <VtsSelect :id="partitionSelectId" accent="brand" />
        </VtsInputWrapper>

        <div class="path typo-body-bold">
          <UiButton
            v-if="path !== '/'"
            accent="brand"
            variant="tertiary"
            size="small"
            left-icon="fa:arrow-up"
            @click="openDirectory(parentPath)"
          >
            {{ t('action:parent-directory') }}
          </UiButton>
          <span>{{ path }}</span>
        </div>

        <VtsStateHero v-if="isLoading" type="busy" format="card" horizontal size="extra-small" />
        <div v-else class="entries">
          <div v-for="entry of entries" :key="entry" class="entry">
            <UiCheckbox v-model="selected" :value="path + entry" accent="brand" />
            <UiButton
              v-if="entry.endsWith('/')"
              accent="brand"
              variant="tertiary"
              size="small"
              left-icon="fa:folder-closed"
              @click="openDirectory(path + entry)"
            >
              {{ entry }}
            </UiButton>
            <span v-else class="file">{{ entry }}</span>
          </div>
          <VtsStateHero v-if="entries.length === 0" type="no-data" format="card" horizontal size="extra-small">
            {{ t('file-restore:empty-directory') }}
          </VtsStateHero>
        </div>
        <p class="selection typo-body-regular-small">{{ t('file-restore:n-selected', { n: selected.length }) }}</p>
      </div>
    </template>

    <template #buttons>
      <VtsOverlayCancelButton @click="emit('cancel')" />
      <VtsOverlayConfirmButton :disabled="selected.length === 0 || isDownloading">
        {{ t('action:download-zip') }}
      </VtsOverlayConfirmButton>
    </template>
  </UiModal>
</template>

<script lang="ts" setup>
import { filenameFromDisposition, toErrorMessage } from '@/modules/system/utils/system.util.ts'
import type { FrontXoVmBackupArchive } from '@/modules/vm/remote-resources/use-xo-vm-backup-archive-collection.ts'
import { BASE_URL, fetchPost } from '@/shared/utils/fetch.util.ts'
import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import VtsSelect from '@core/components/select/VtsSelect.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'
import UiModal from '@core/components/ui/modal/UiModal.vue'
import { useFormSelect } from '@core/packages/form-select'
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

type Partition = { id: string; name?: string; size?: number; type?: string }

const { backupArchive } = defineProps<{
  backupArchive: FrontXoVmBackupArchive
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const { t } = useI18n()

const repository = computed(() => backupArchive.backupRepository)

const diskId = ref<string | undefined>(backupArchive.disks[0]?.id)
const partitions = ref<Partition[]>([])
const partitionId = ref<string>()
const path = ref('/')
const entries = ref<string[]>([])
const selected = ref<string[]>([])
const isLoading = ref(false)
const isDownloading = ref(false)
const error = ref<string>()

const { id: diskSelectId } = useFormSelect(
  computed(() => backupArchive.disks),
  { model: diskId, required: true, option: { id: disk => disk.id, value: disk => disk.id, label: disk => disk.name } }
)

const { id: partitionSelectId } = useFormSelect(partitions, {
  model: partitionId,
  required: true,
  option: {
    id: partition => partition.id,
    value: partition => partition.id,
    label: partition => [partition.name ?? partition.id, partition.type].filter(Boolean).join(' · '),
  },
})

const parentPath = computed(() => path.value.replace(/[^/]+\/$/, ''))

async function run(action: () => Promise<void>) {
  isLoading.value = true
  error.value = undefined
  try {
    await action()
  } catch (cause) {
    error.value = toErrorMessage(cause)
  } finally {
    isLoading.value = false
  }
}

function openDirectory(newPath: string) {
  return run(async () => {
    entries.value = await fetchPost<string[]>(`backup-repositories/${repository.value}/actions/list_partition_files`, {
      disk: diskId.value,
      partition: partitionId.value,
      path: newPath,
    })
    path.value = newPath
  })
}

function loadPartitions() {
  selected.value = []
  return run(async () => {
    partitions.value = await fetchPost<Partition[]>(`backup-repositories/${repository.value}/actions/list_partitions`, {
      disk: diskId.value,
    })
    // a disk without partition table is read as one file system
    partitionId.value = partitions.value[0]?.id
  }).then(() => openDirectory('/'))
}

onMounted(loadPartitions)
watch(diskId, loadPartitions)
watch(partitionId, (id, previous) => {
  if (previous !== undefined) {
    selected.value = []
    openDirectory('/')
  }
})

async function download() {
  if (selected.value.length === 0) {
    return
  }
  isDownloading.value = true
  error.value = undefined
  try {
    const response = await fetch(`${BASE_URL}/backup-repositories/${repository.value}/actions/fetch_partition_files`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        disk: diskId.value,
        partition: partitionId.value,
        paths: selected.value,
        format: 'zip',
      }),
    })
    if (!response.ok) {
      const body = await response.json().catch(() => undefined)
      throw new Error(typeof body?.error === 'string' ? body.error : response.statusText)
    }
    const url = URL.createObjectURL(await response.blob())
    const link = document.createElement('a')
    link.href = url
    link.download = filenameFromDisposition(response.headers.get('content-disposition'), 'restore.zip')
    link.click()
    URL.revokeObjectURL(url)
    emit('confirm')
  } catch (cause) {
    error.value = toErrorMessage(cause)
  } finally {
    isDownloading.value = false
  }
}
</script>

<style lang="postcss" scoped>
.file-restore {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  text-align: left;

  .path {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    overflow-wrap: anywhere;
  }

  .entries {
    max-height: 32rem;
    overflow: auto;

    .entry {
      display: flex;
      align-items: center;
      gap: 0.8rem;
      min-height: 3.2rem;

      .file {
        overflow-wrap: anywhere;
      }
    }
  }

  .selection {
    color: var(--color-neutral-txt-secondary);
  }
}
</style>
