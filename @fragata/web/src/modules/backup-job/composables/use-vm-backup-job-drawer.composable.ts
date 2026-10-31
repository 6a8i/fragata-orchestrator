import type { VmBackupJobPayload } from '@/modules/backup-job/form/use-vm-backup-job-form.ts'
import { useXoVmBackupJobCreateJob } from '@/modules/backup-job/jobs/xo-backup-job-create.job.ts'
import { useXoVmBackupJobEditJob } from '@/modules/backup-job/jobs/xo-backup-job-edit.job.ts'
import type { FrontAnyXoBackupJob } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import { type FrontXoSchedule, useXoScheduleCollection } from '@/modules/schedule/remote-resources/use-xo-schedule-collection.ts'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { KEEP_OVERLAY_OPEN } from '@core/packages/overlay/symbols.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter, ref } from 'vue'

/**
 * Opens the VM backup job drawer, either to create a job or to edit `rawBackupJob`.
 *
 * Editing covers the job and its first schedule; the other schedules keep their settings.
 */
export function useVmBackupJobDrawer(rawBackupJob?: MaybeRefOrGetter<FrontAnyXoBackupJob | undefined>) {
  const backupJob = toComputed(rawBackupJob)

  const { schedulesByJobId } = useXoScheduleCollection()

  const selectedBackupJobId = useRouteQuery('id')

  const schedules = computed<FrontXoSchedule[]>(() =>
    backupJob.value !== undefined ? (schedulesByJobId.value.get(backupJob.value.id) ?? []) : []
  )

  const firstSchedule = computed(() => schedules.value[0])

  const payload = ref<VmBackupJobPayload>()

  const { run: runCreate } = useXoVmBackupJobCreateJob(payload)

  const {
    run: runEdit,
    canRun: canEditBackupJob,
    errorMessage: editBackupJobErrorMessage,
  } = useXoVmBackupJobEditJob(backupJob, firstSchedule, payload)

  const { open: openNewVmBackupJobDrawer } = useOverlay({
    component: () => import('@/modules/backup-job/components/drawer/VmBackupJobDrawer.vue'),
    events: {
      onConfirm: async (newPayload: VmBackupJobPayload) => {
        payload.value = newPayload

        try {
          const id = await runCreate()
          selectedBackupJobId.value = id
        } catch (error) {
          console.error('Failed to create backup job', error)
          return KEEP_OVERLAY_OPEN
        }
      },
      onCancel: true,
    },
  })

  const { open: openEditDrawer } = useOverlay({
    component: () => import('@/modules/backup-job/components/drawer/VmBackupJobDrawer.vue'),
    events: {
      onConfirm: async (newPayload: VmBackupJobPayload) => {
        payload.value = newPayload

        try {
          await runEdit()
        } catch (error) {
          console.error('Failed to edit backup job', error)
          return KEEP_OVERLAY_OPEN
        }
      },
      onCancel: true,
    },
  })

  function openEditVmBackupJobDrawer() {
    const job = backupJob.value

    if (job === undefined || job.type !== 'backup') {
      return
    }

    return openEditDrawer({
      props: {
        backupJob: job,
        schedule: firstSchedule.value,
        otherSchedulesCount: Math.max(0, schedules.value.length - 1),
      },
    })
  }

  return {
    openNewVmBackupJobDrawer,
    openEditVmBackupJobDrawer,
    canEditBackupJob,
    editBackupJobErrorMessage,
  }
}
