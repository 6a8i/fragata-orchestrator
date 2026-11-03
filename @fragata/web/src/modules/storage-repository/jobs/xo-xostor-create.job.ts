import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import type { XostorProvisioning } from '@/modules/storage-repository/utils/xostor.util.ts'
import type { FrontXoTask } from '@/modules/task/remote-resources/use-xo-task-collection.ts'
import { useXoTaskUtils } from '@/shared/composables/xo-task-utils.composable.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { defineJob, defineJobArg, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

/** Pool and body of `POST /pools/{id}/actions/create_xostor` */
export type NewXostorPayload = {
  poolId: string
  name_label: string
  name_description?: string
  /** device paths (e.g. `/dev/sdb`) by host ID */
  disksByHost: Record<string, string[]>
  provisioning: XostorProvisioning
  replication: number
  ignoreFileSystems?: boolean
}

export const newXostorPayloadArg = defineJobArg<NewXostorPayload>({
  identify: false,
  toArray: false,
})

export const useXoXostorCreateJob = defineJob('sr.create-xostor', [newXostorPayloadArg], () => {
  const { t } = useI18n()
  const { monitorTask } = useXoTaskUtils()

  return {
    async run({ poolId, ...body }: NewXostorPayload): Promise<FrontXoSr['id']> {
      // installs packages and restarts toolstacks: follow the task instead of holding the request
      const { taskId } = await fetchPost<{ taskId: FrontXoTask['id'] }>(`pools/${poolId}/actions/create_xostor`, body)
      const { id } = await monitorTask<{ id: FrontXoSr['id'] }>(taskId)
      return id
    },

    validate(isRunning, payload: NewXostorPayload | undefined) {
      if (isRunning) {
        throw new JobRunningError(t('job:create:in-progress'))
      }

      if (payload === undefined) {
        throw new JobError(t('job:arg:missing-payload'))
      }

      if (payload.name_label === '') {
        throw new JobError(t('job:arg:name-required'))
      }

      const nHostsWithDisks = Object.values(payload.disksByHost).filter(disks => disks.length > 0).length
      if (nHostsWithDisks === 0) {
        throw new JobError(t('job:xostor-create:disks-required'))
      }

      if (payload.replication < 1 || payload.replication > nHostsWithDisks) {
        throw new JobError(t('xostor:replication-too-high'))
      }
    },
  }
})
