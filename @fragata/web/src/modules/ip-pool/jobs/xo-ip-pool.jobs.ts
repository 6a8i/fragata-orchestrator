import type { FrontXoIpPool } from '@/modules/ip-pool/remote-resources/use-xo-ip-pool-collection.ts'
import { fetchDelete, fetchPatch, fetchPost } from '@/shared/utils/fetch.util.ts'
import { defineJob, defineJobArg, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

export type IpPoolPayload = {
  name: string
  /** single addresses or IPv4 ranges */
  addresses: string[]
  networks: string[]
}

/** `undefined` creates a new IP pool */
export const ipPoolTargetArg = defineJobArg<string | undefined>({
  identify: false,
  toArray: false,
})

export const ipPoolPayloadArg = defineJobArg<IpPoolPayload>({
  identify: false,
  toArray: false,
})

export const useXoIpPoolSaveJob = defineJob('ip-pool.save', [ipPoolTargetArg, ipPoolPayloadArg], () => {
  const { t } = useI18n()

  return {
    async run(ipPoolId: string | undefined, payload: IpPoolPayload) {
      if (ipPoolId === undefined) {
        await fetchPost('ip-pools', payload)
      } else {
        await fetchPatch(`ip-pools/${ipPoolId}`, payload)
      }
    },

    validate(isRunning, _ipPoolId: string | undefined, payload: IpPoolPayload | undefined) {
      if (isRunning) {
        throw new JobRunningError(t('job:edit:in-progress'))
      }

      if (payload !== undefined && payload.name === '') {
        throw new JobError(t('job:arg:name-required'))
      }
    },
  }
})

export const xoIpPoolArg = defineJobArg({
  identify: (ipPool: FrontXoIpPool) => ipPool.id,
  toArray: false,
})

export const useXoIpPoolDeleteJob = defineJob('ip-pool.delete', [xoIpPoolArg], () => {
  const { t } = useI18n()

  return {
    async run(ipPool: FrontXoIpPool) {
      await fetchDelete(`ip-pools/${ipPool.id}`)
    },

    validate(isRunning, ipPool: FrontXoIpPool | undefined) {
      if (ipPool === undefined) {
        throw new JobError(t('job:arg:ip-pool-required'))
      }

      if (isRunning) {
        throw new JobRunningError(t('job:ip-pool-delete:in-progress'))
      }
    },
  }
})
