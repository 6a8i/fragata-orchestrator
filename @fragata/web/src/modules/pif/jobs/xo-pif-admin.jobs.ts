import { xoPifArg } from '@/modules/pif/jobs/xo-pif-args.ts'
import type { FrontXoPif } from '@/modules/pif/remote-resources/use-xo-pif-collection.ts'
import type { FrontXoTask } from '@/modules/task/remote-resources/use-xo-task-collection.ts'
import { useXoTaskUtils } from '@/shared/composables/xo-task-utils.composable.ts'
import { fetchPatch, fetchPost } from '@/shared/utils/fetch.util.ts'
import { defineJob, defineJobArg, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

export type PifIpPayload = {
  mode: 'None' | 'DHCP' | 'Static'
  ip?: string
  netmask?: string
  gateway?: string
  dns?: string
}

export const pifIpPayloadArg = defineJobArg<PifIpPayload>({
  identify: false,
  toArray: false,
})

export const useXoPifReconfigureIpJob = defineJob('pif.reconfigure-ip', [xoPifArg, pifIpPayloadArg], () => {
  const { t } = useI18n()
  const { monitorTask } = useXoTaskUtils()

  return {
    async run(pif: FrontXoPif, payload: PifIpPayload) {
      const { taskId } = await fetchPost<{ taskId: FrontXoTask['id'] }>(`pifs/${pif.id}/actions/reconfigure_ip`, payload)
      await monitorTask(taskId)
    },

    validate(isRunning, pif: FrontXoPif | undefined, payload: PifIpPayload | undefined) {
      if (pif === undefined) {
        throw new JobError(t('job:arg:pif-required'))
      }

      if (isRunning) {
        throw new JobRunningError(t('job:pif:in-progress'))
      }

      if (payload?.mode === 'Static' && (!payload.ip || !payload.netmask)) {
        throw new JobError(t('job:pif-ip:static-needs-ip'))
      }
    },
  }
})

/** New VLAN tag */
export const pifVlanArg = defineJobArg<number>({
  identify: false,
  toArray: false,
})

export const useXoPifEditVlanJob = defineJob('pif.edit-vlan', [xoPifArg, pifVlanArg], () => {
  const { t } = useI18n()

  return {
    async run(pif: FrontXoPif, vlan: number) {
      await fetchPatch(`pifs/${pif.id}`, { vlan })
    },

    validate(isRunning, pif: FrontXoPif | undefined, vlan: number | undefined) {
      if (pif === undefined) {
        throw new JobError(t('job:arg:pif-required'))
      }

      if (pif.vlan === -1) {
        throw new JobError(t('job:pif-vlan:not-a-vlan'))
      }

      if (isRunning) {
        throw new JobRunningError(t('job:pif:in-progress'))
      }

      if (vlan !== undefined && !(Number.isInteger(vlan) && vlan >= 0 && vlan <= 4094)) {
        throw new JobError(t('job:pif-vlan:invalid'))
      }
    },
  }
})

function definePifPlugJob(name: string, path: 'connect' | 'disconnect') {
  return defineJob(name, [xoPifArg], () => {
    const { t } = useI18n()
    const { monitorTask } = useXoTaskUtils()

    return {
      async run(pif: FrontXoPif) {
        const { taskId } = await fetchPost<{ taskId: FrontXoTask['id'] }>(`pifs/${pif.id}/actions/${path}`)
        await monitorTask(taskId)
      },

      validate(isRunning, pif: FrontXoPif | undefined) {
        if (pif === undefined) {
          throw new JobError(t('job:arg:pif-required'))
        }

        if (path === 'disconnect' && pif.management) {
          throw new JobError(t('job:pif-disconnect:management'))
        }

        if (isRunning) {
          throw new JobRunningError(t('job:pif:in-progress'))
        }
      },
    }
  })
}

export const useXoPifConnectJob = definePifPlugJob('pif.connect', 'connect')

export const useXoPifDisconnectJob = definePifPlugJob('pif.disconnect', 'disconnect')
