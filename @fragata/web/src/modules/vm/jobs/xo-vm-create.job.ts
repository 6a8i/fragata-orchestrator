import { useXoTaskUtils } from '@/shared/composables/xo-task-utils.composable.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { defineJob, defineJobArg, JobError, JobRunningError } from '@core/packages/job'
import type { XoGpuGroup, XoHost, XoPool, XoSr, XoTask, XoVdi, XoVgpuType, XoVm, XoVmTemplate } from '@fragata/types'
import type { Ref } from 'vue'
import { useI18n } from 'vue-i18n'

export type NewVmVdiPayload =
  | /** Create VDI */ {
      name_label: string
      size: number
      sr: XoSr['id'] | undefined
      name_description?: string
    }
  | /** Update VDI */ {
      userdevice: string
      name_label?: string
      size?: number
      sr?: XoSr['id']
      name_description?: string
    }
  | /** Destroy VDI */ {
      destroy: true
      userdevice: string
    }

// Payload that the REST API expects
type TCreateVmPayload = {
  autoPoweron?: boolean
  memory?: number
  cpus?: number
  name_description?: string
  name_label: string
  clone?: boolean
  poolId: XoPool['id']
  template: XoVmTemplate['uuid']
  affinity?: XoHost['id']
  high_availability?: '' | 'restart' | 'best-effort'
  vdis?: NewVmVdiPayload[]
  vifs?: unknown[]
  install?: {
    method: 'cdrom' | 'network' | 'ssh-key'
    repository: XoVdi['id'] | ''
  }
  cloud_config?: string
  network_config?: string
  boot?: boolean
  destroy_cloud_config_vdi?: boolean
  vgpuType?: XoVgpuType['id']
  gpuGroup?: XoGpuGroup['id']
  copyHostBiosString?: boolean
  hvmBootFirmware?: 'uefi' | 'bios'
  createVtpm?: boolean
  /** creates the VM in this resource set (self-service) instead of with the privileges of the user */
  resourceSetId?: string
}
/** the subset of the payload a resource set accepts: new disks and VIFs only */
function toResourceSetBody(payload: Omit<TCreateVmPayload, 'poolId' | 'resourceSetId'>) {
  return {
    name_label: payload.name_label,
    name_description: payload.name_description,
    template: payload.template,
    cpus: payload.cpus,
    memory: payload.memory,
    vdis: payload.vdis?.flatMap(vdi =>
      'userdevice' in vdi || vdi.sr === undefined ? [] : [{ name_label: vdi.name_label, size: vdi.size, sr: vdi.sr }]
    ),
    vifs: (payload.vifs as { network?: string }[] | undefined)?.flatMap(vif =>
      vif.network === undefined ? [] : [{ network: vif.network }]
    ),
    cloud_config: payload.cloud_config,
    network_config: payload.network_config,
    boot: payload.boot,
  }
}

const payloadsArg = defineJobArg<Ref<TCreateVmPayload>>({
  identify: payload => payload.value.poolId,
  toArray: true,
})

export const useXoVmCreateJob = defineJob('vm.create', [payloadsArg], () => {
  const { monitorTask } = useXoTaskUtils()
  const { t } = useI18n()

  return {
    run(payloads): Promise<PromiseSettledResult<XoVm['id']>[]> {
      return Promise.allSettled(
        payloads.map(async payload => {
          const { poolId, resourceSetId, ...rest } = payload.value
          if (resourceSetId !== undefined) {
            const { id } = await fetchPost<{ id: XoVm['id'] }>(
              `resource-sets/${resourceSetId}/actions/create_vm`,
              toResourceSetBody(rest)
            )
            return id
          }
          const { taskId } = await fetchPost<{ taskId: XoTask['id'] }>(`pools/${poolId}/actions/create_vm`, rest)
          const { id } = await monitorTask<{ id: XoVm['id'] }>(taskId)
          return id
        })
      )
    },

    validate(isRunning, payloads) {
      if (isRunning) {
        throw new JobRunningError(t('job:create:in-progress'))
      }

      if (payloads.length === 0) {
        throw new JobError(t('job:arg:missing-payload'))
      }

      payloads.forEach(payload => {
        const { value } = payload

        if (value.poolId === undefined) {
          throw new JobError(t('job:arg:pool-id-required'))
        }

        if (value.template === undefined) {
          throw new JobError(t('job:arg:template-uuid-required'))
        }

        if (
          value.install !== undefined &&
          (value.install.method === undefined || value.install.repository === undefined)
        ) {
          throw new JobError(t('job:vm-create:incomplete-install-mode'))
        }

        if (value.name_label.length === 0) {
          throw new JobError(t('job:arg:name-required'))
        }

        if (value.vdis?.some(vdi => !('userdevice' in vdi) && vdi.sr === undefined)) {
          throw new JobError(t('job:arg:sr-vdi-required'))
        }
      })
    },
  }
})
