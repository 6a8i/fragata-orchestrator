import { xoHostArg } from '@/modules/host/jobs/xo-host-args.ts'
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { FrontXoTask } from '@/modules/task/remote-resources/use-xo-task-collection.ts'
import { useXoTaskUtils } from '@/shared/composables/xo-task-utils.composable.ts'
import { fetchPatch, fetchPost, fetchRequest } from '@/shared/utils/fetch.util.ts'
import { defineJob, defineJobArg, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

/** Subset of the `PATCH /hosts/{id}` body the settings drawer can change */
export type EditHostPayload = {
  nameLabel?: string
  nameDescription?: string
  iscsiIqn?: string
  multipathing?: boolean
  syslogDestination?: string | null
}

export const editHostPayloadArg = defineJobArg<EditHostPayload>({
  identify: false,
  toArray: false,
})

export const useXoHostEditJob = defineJob('host.edit', [xoHostArg, editHostPayloadArg], () => {
  const { t } = useI18n()

  return {
    async run(host: FrontXoHost, payload: EditHostPayload) {
      await fetchPatch(`hosts/${host.id}`, payload)
    },

    validate(isRunning, host: FrontXoHost | undefined, payload: EditHostPayload | undefined) {
      if (host === undefined) {
        throw new JobError(t('job:arg:host-required'))
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

export type HostCertificatePayload = {
  certificate: string
  privateKey: string
  chain?: string
}

export const hostCertificateArg = defineJobArg<HostCertificatePayload>({
  identify: false,
  toArray: false,
})

export const useXoHostInstallCertificateJob = defineJob(
  'host.install-certificate',
  [xoHostArg, hostCertificateArg],
  () => {
    const { t } = useI18n()
    const { monitorTask } = useXoTaskUtils()

    return {
      async run(host: FrontXoHost, payload: HostCertificatePayload) {
        const { taskId } = await fetchPost<{ taskId: FrontXoTask['id'] }>(
          `hosts/${host.id}/actions/install_certificate`,
          payload
        )
        await monitorTask(taskId)
      },

      validate(isRunning, host: FrontXoHost | undefined, payload: HostCertificatePayload | undefined) {
        if (host === undefined) {
          throw new JobError(t('job:arg:host-required'))
        }

        if (isRunning) {
          throw new JobRunningError(t('job:host:in-progress'))
        }

        if (payload !== undefined && (payload.certificate === '' || payload.privateKey === '')) {
          throw new JobError(t('job:host-certificate:required'))
        }
      },
    }
  }
)

/** Memory of the control domain, in bytes */
export const hostControlDomainMemoryArg = defineJobArg<number>({
  identify: false,
  toArray: false,
})

export const useXoHostSetControlDomainMemoryJob = defineJob(
  'host.set-control-domain-memory',
  [xoHostArg, hostControlDomainMemoryArg],
  () => {
    const { t } = useI18n()
    const { monitorTask } = useXoTaskUtils()

    return {
      async run(host: FrontXoHost, memory: number) {
        const { taskId } = await fetchPost<{ taskId: FrontXoTask['id'] }>(
          `hosts/${host.id}/actions/set_control_domain_memory`,
          { memory }
        )
        await monitorTask(taskId)
      },

      validate(isRunning, host: FrontXoHost | undefined, memory: number | undefined) {
        if (host === undefined) {
          throw new JobError(t('job:arg:host-required'))
        }

        if (host.enabled) {
          throw new JobError(t('job:host-control-domain-memory:host-enabled'))
        }

        if (isRunning) {
          throw new JobRunningError(t('job:host:in-progress'))
        }

        if (memory !== undefined && !(memory > 0)) {
          throw new JobError(t('job:host-control-domain-memory:invalid'))
        }
      },
    }
  }
)

export const hostSupplementalPackArg = defineJobArg<File>({
  identify: false,
  toArray: false,
})

export const useXoHostInstallSupplementalPackJob = defineJob(
  'host.install-supplemental-pack',
  [xoHostArg, hostSupplementalPackArg],
  () => {
    const { t } = useI18n()

    return {
      async run(host: FrontXoHost, file: File) {
        await fetchRequest(`hosts/${host.id}/supplemental_pack`, {
          method: 'POST',
          body: file,
          headers: { 'Content-Type': 'application/octet-stream' },
        })
      },

      validate(isRunning, host: FrontXoHost | undefined) {
        if (host === undefined) {
          throw new JobError(t('job:arg:host-required'))
        }

        if (isRunning) {
          throw new JobRunningError(t('job:host:in-progress'))
        }
      },
    }
  }
)
