import type {
  FrontAnyXoBackupJob,
  FrontXoMetadataBackupJob,
  FrontXoMirrorBackupJob,
} from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import {
  type OtherBackupJobForm,
  type OtherBackupJobKind,
  toCreateBody,
  toUpdateBody,
} from '@/modules/backup-job/utils/other-backup-job.util.ts'
import { fetchPatch, fetchPost } from '@/shared/utils/fetch.util.ts'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { KEEP_OVERLAY_OPEN } from '@core/packages/overlay/symbols.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { ref } from 'vue'

const KIND_BY_TYPE: Partial<Record<FrontAnyXoBackupJob['type'], OtherBackupJobKind>> = {
  metadataBackup: 'metadata',
  mirrorBackup: 'mirror',
}

/** the kind of a metadata or mirror backup job, `undefined` for a VM backup job */
export function otherBackupJobKind(job: FrontAnyXoBackupJob): OtherBackupJobKind | undefined {
  return KIND_BY_TYPE[job.type]
}

/** Opens the modal creating or editing a metadata or a mirror backup job */
export function useOtherBackupJobModal() {
  const selectedBackupJobId = useRouteQuery('id')

  const current = ref<{ kind: OtherBackupJobKind; job?: FrontXoMetadataBackupJob | FrontXoMirrorBackupJob }>()

  const { open } = useOverlay({
    component: () => import('@/modules/backup-job/components/modal/OtherBackupJobModal.vue'),
    events: {
      onConfirm: async (form: OtherBackupJobForm) => {
        const { kind, job } = current.value!
        try {
          if (job === undefined) {
            const { id } = await fetchPost<{ id: string }>(`backup-jobs/${kind}`, toCreateBody(kind, form))
            selectedBackupJobId.value = id
          } else {
            await fetchPatch(
              `backup-jobs/${kind}/${job.id}`,
              toUpdateBody(kind, form, job.settings as Record<string, Record<string, unknown>>)
            )
          }
        } catch (error) {
          console.error('Failed to save the backup job', error)
          return KEEP_OVERLAY_OPEN
        }
      },
      onCancel: true,
    },
  })

  function openOtherBackupJobModal(kind: OtherBackupJobKind, job?: FrontXoMetadataBackupJob | FrontXoMirrorBackupJob) {
    current.value = { kind, job }
    return open({ props: { kind, backupJob: job } })
  }

  return { openOtherBackupJobModal }
}
