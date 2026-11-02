import type { FrontXoUser } from '@/modules/user/remote-resources/use-xo-user-collection.ts'
import { fetchDelete, fetchPatch, fetchPost } from '@/shared/utils/fetch.util.ts'
import { defineJob, defineJobArg, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

export type UserPayload = {
  name: string
  password?: string
  permission: 'none' | 'admin'
}

export const userPayloadArg = defineJobArg<UserPayload>({ identify: false, toArray: false })

export const xoUserArg = defineJobArg({
  identify: (user: FrontXoUser) => user.id,
  toArray: false,
})

export const useXoUserCreateJob = defineJob('user.create', [userPayloadArg], () => {
  const { t } = useI18n()

  return {
    async run(payload: UserPayload): Promise<FrontXoUser['id']> {
      const { id } = await fetchPost<{ id: FrontXoUser['id'] }>('users', payload)
      return id
    },

    validate(isRunning, payload: UserPayload | undefined) {
      if (isRunning) {
        throw new JobRunningError(t('job:create:in-progress'))
      }

      if (payload === undefined) {
        throw new JobError(t('job:arg:missing-payload'))
      }

      if (payload.name === '') {
        throw new JobError(t('job:arg:name-required'))
      }

      if (payload.password === undefined || payload.password === '') {
        throw new JobError(t('job:user:password-required'))
      }
    },
  }
})

export const useXoUserEditJob = defineJob('user.edit', [xoUserArg, userPayloadArg], () => {
  const { t } = useI18n()

  return {
    async run(user: FrontXoUser, payload: UserPayload) {
      // an empty password keeps the current one
      const { password, ...rest } = payload
      await fetchPatch(`users/${user.id}`, { ...rest, ...(password !== undefined && password !== '' && { password }) })
    },

    validate(isRunning, user: FrontXoUser | undefined, payload: UserPayload | undefined) {
      if (user === undefined) {
        throw new JobError(t('job:user:user-required'))
      }

      if (isRunning) {
        throw new JobRunningError(t('job:edit:in-progress'))
      }

      if (payload !== undefined && payload.name === '') {
        throw new JobError(t('job:arg:name-required'))
      }
    },
  }
})

export const useXoUserDeleteJob = defineJob('user.delete', [xoUserArg], () => {
  const { t } = useI18n()

  return {
    async run(user: FrontXoUser) {
      await fetchDelete(`users/${user.id}`)
    },

    validate(isRunning, user: FrontXoUser | undefined) {
      if (user === undefined) {
        throw new JobError(t('job:user:user-required'))
      }

      if (isRunning) {
        throw new JobRunningError(t('job:delete:in-progress'))
      }
    },
  }
})
