import type { FrontXoNetwork } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import { fetchPatch } from '@/shared/utils/fetch.util.ts'
import { defineJob, defineJobArg, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

/** Subset of the `PATCH /networks/{id}` body the edit drawer can change */
export type EditNetworkPayload = {
  nameLabel?: string
  nameDescription?: string
  mtu?: number
  automatic?: boolean
  defaultIsLocked?: boolean
  nbd?: boolean
  insecureNbd?: boolean
}

export const xoEditedNetworkArg = defineJobArg({
  identify: (network: FrontXoNetwork) => network.id,
  toArray: false,
})

export const editNetworkPayloadArg = defineJobArg<EditNetworkPayload>({
  identify: false,
  toArray: false,
})

export const useXoNetworkEditJob = defineJob('network.edit', [xoEditedNetworkArg, editNetworkPayloadArg], () => {
  const { t } = useI18n()

  return {
    async run(network: FrontXoNetwork, payload: EditNetworkPayload) {
      await fetchPatch(`networks/${network.id}`, payload)
    },

    validate(isRunning, network: FrontXoNetwork | undefined, payload: EditNetworkPayload | undefined) {
      if (network === undefined) {
        throw new JobError(t('job:arg:network-required'))
      }

      if (isRunning) {
        throw new JobRunningError(t('job:edit:in-progress'))
      }

      if (payload !== undefined && payload.nameLabel === '') {
        throw new JobError(t('job:arg:name-required'))
      }
    },
  }
})
