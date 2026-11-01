import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { defineJob, defineJobArg, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

/** Body of `POST /srs` */
export type NewSrPayload = {
  hostId: string
  SR_type: string
  name_label: string
  name_description?: string
  content_type?: string
  device_config: Record<string, string>
}

export const newSrPayloadArg = defineJobArg<NewSrPayload>({
  identify: false,
  toArray: false,
})

export const useXoSrCreateJob = defineJob('sr.create', [newSrPayloadArg], () => {
  const { t } = useI18n()

  return {
    async run(payload: NewSrPayload): Promise<FrontXoSr['id']> {
      const { id } = await fetchPost<{ id: FrontXoSr['id'] }>('srs', payload)
      return id
    },

    validate(isRunning, payload: NewSrPayload | undefined) {
      if (isRunning) {
        throw new JobRunningError(t('job:create:in-progress'))
      }

      if (payload === undefined) {
        throw new JobError(t('job:arg:missing-payload'))
      }

      if (payload.name_label === '') {
        throw new JobError(t('job:arg:name-required'))
      }

      if (payload.hostId === '') {
        throw new JobError(t('job:sr-create:host-required'))
      }
    },
  }
})
