import type { FrontXoResourceSet } from '@/modules/resource-set/remote-resources/use-xo-resource-set-collection.ts'
import { fetchDelete, fetchPatch, fetchPost } from '@/shared/utils/fetch.util.ts'
import { defineJob, defineJobArg, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

export type ResourceSetPayload = {
  name: string
  subjects: string[]
  objects: string[]
  limits: Record<string, number>
  shareByDefault: boolean
}

/** `undefined` creates a new set */
export const resourceSetTargetArg = defineJobArg<string | undefined>({
  identify: false,
  toArray: false,
})

export const resourceSetPayloadArg = defineJobArg<ResourceSetPayload>({
  identify: false,
  toArray: false,
})

export const useXoResourceSetSaveJob = defineJob(
  'resource-set.save',
  [resourceSetTargetArg, resourceSetPayloadArg],
  () => {
    const { t } = useI18n()

    return {
      async run(id: string | undefined, payload: ResourceSetPayload) {
        if (id === undefined) {
          await fetchPost('resource-sets', payload)
        } else {
          await fetchPatch(`resource-sets/${id}`, payload)
        }
      },

      validate(isRunning, _id: string | undefined, payload: ResourceSetPayload | undefined) {
        if (isRunning) {
          throw new JobRunningError(t('job:edit:in-progress'))
        }

        if (payload !== undefined && payload.name === '') {
          throw new JobError(t('job:arg:name-required'))
        }
      },
    }
  }
)

export const xoResourceSetArg = defineJobArg({
  identify: (set: FrontXoResourceSet) => set.id,
  toArray: false,
})

export const useXoResourceSetDeleteJob = defineJob('resource-set.delete', [xoResourceSetArg], () => {
  const { t } = useI18n()

  return {
    async run(set: FrontXoResourceSet) {
      await fetchDelete(`resource-sets/${set.id}`)
    },

    validate(isRunning, set: FrontXoResourceSet | undefined) {
      if (set === undefined) {
        throw new JobError(t('job:arg:resource-set-required'))
      }

      if (isRunning) {
        throw new JobRunningError(t('job:resource-set-delete:in-progress'))
      }
    },
  }
})
