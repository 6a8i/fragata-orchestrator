import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import type { FrontXoTask } from '@/modules/task/remote-resources/use-xo-task-collection.ts'
import { useXoTaskUtils } from '@/shared/composables/xo-task-utils.composable.ts'
import { fetchPatch, fetchPost } from '@/shared/utils/fetch.util.ts'
import { defineJob, defineJobArg, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

export const xoPoolArg = defineJobArg({
  identify: (pool: FrontXoPool) => pool.id,
  toArray: false,
})

/** Subset of the `PATCH /pools/{id}` body the settings drawer can change */
export type EditPoolPayload = {
  nameLabel?: string
  nameDescription?: string
  autoPoweron?: boolean
  migrationCompression?: boolean
  defaultSrId?: string | null
  suspendSrId?: string | null
  crashDumpSrId?: string | null
}

export const editPoolPayloadArg = defineJobArg<EditPoolPayload>({
  identify: false,
  toArray: false,
})

export const useXoPoolEditJob = defineJob('pool.edit', [xoPoolArg, editPoolPayloadArg], () => {
  const { t } = useI18n()

  return {
    async run(pool: FrontXoPool, payload: EditPoolPayload) {
      await fetchPatch(`pools/${pool.id}`, payload)
    },

    validate(isRunning, pool: FrontXoPool | undefined, payload: EditPoolPayload | undefined) {
      if (pool === undefined) {
        throw new JobError(t('job:arg:pool-required'))
      }

      if (isRunning) {
        throw new JobRunningError(t('job:edit:in-progress'))
      }

      // The payload only exists once the drawer is confirmed
      if (payload !== undefined && payload.nameLabel === '') {
        throw new JobError(t('job:arg:name-required'))
      }
    },
  }
})

/** Id of the host to make master of the pool */
export const poolMasterHostArg = defineJobArg<string>({
  identify: false,
  toArray: false,
})

export const useXoPoolSetMasterJob = defineJob('pool.set-master', [xoPoolArg, poolMasterHostArg], () => {
  const { t } = useI18n()
  const { monitorTask } = useXoTaskUtils()

  return {
    async run(pool: FrontXoPool, hostId: string) {
      const { taskId } = await fetchPost<{ taskId: FrontXoTask['id'] }>(`pools/${pool.id}/actions/set_master`, {
        hostId,
      })
      await monitorTask(taskId)
    },

    validate(isRunning, pool: FrontXoPool | undefined, hostId: string | undefined) {
      if (pool === undefined) {
        throw new JobError(t('job:arg:pool-required'))
      }

      if (isRunning) {
        throw new JobRunningError(t('job:pool:in-progress'))
      }

      if (hostId !== undefined && hostId === pool.master) {
        throw new JobError(t('job:pool-set-master:already-master'))
      }
    },
  }
})

/** Ids of the SRs used for the HA heartbeat */
export const poolHeartbeatSrsArg = defineJobArg<string[]>({
  identify: false,
  toArray: false,
})

export const useXoPoolEnableHaJob = defineJob('pool.enable-ha', [xoPoolArg, poolHeartbeatSrsArg], () => {
  const { t } = useI18n()
  const { monitorTask } = useXoTaskUtils()

  return {
    async run(pool: FrontXoPool, heartbeatSrIds: string[]) {
      const { taskId } = await fetchPost<{ taskId: FrontXoTask['id'] }>(`pools/${pool.id}/actions/enable_ha`, {
        heartbeatSrIds,
      })
      await monitorTask(taskId)
    },

    validate(isRunning, pool: FrontXoPool | undefined, heartbeatSrIds: string[] | undefined) {
      if (pool === undefined) {
        throw new JobError(t('job:arg:pool-required'))
      }

      if (pool.HA_enabled) {
        throw new JobError(t('job:pool-ha:already-enabled'))
      }

      if (isRunning) {
        throw new JobRunningError(t('job:pool:in-progress'))
      }

      if (heartbeatSrIds !== undefined && heartbeatSrIds.length === 0) {
        throw new JobError(t('job:pool-ha:heartbeat-sr-required'))
      }
    },
  }
})

function definePoolTaskAction(name: string, path: string, check?: (pool: FrontXoPool) => string | undefined) {
  return defineJob(name, [xoPoolArg], () => {
    const { t } = useI18n()
    const { monitorTask } = useXoTaskUtils()

    return {
      async run(pool: FrontXoPool) {
        const { taskId } = await fetchPost<{ taskId: FrontXoTask['id'] }>(`pools/${pool.id}/actions/${path}`)
        await monitorTask(taskId)
      },

      validate(isRunning, pool: FrontXoPool | undefined) {
        if (pool === undefined) {
          throw new JobError(t('job:arg:pool-required'))
        }

        const errorKey = check?.(pool)
        if (errorKey !== undefined) {
          throw new JobError(t(errorKey))
        }

        if (isRunning) {
          throw new JobRunningError(t('job:pool:in-progress'))
        }
      },
    }
  })
}

export const useXoPoolDisableHaJob = definePoolTaskAction('pool.disable-ha', 'disable_ha', pool =>
  pool.HA_enabled ? undefined : 'job:pool-ha:already-disabled'
)

export const useXoPoolRollingRebootJob = definePoolTaskAction('pool.rolling-reboot', 'rolling_reboot')

export const useXoPoolRollingUpdateJob = definePoolTaskAction('pool.rolling-update', 'rolling_update')

export const useXoPoolInstallPatchesJob = definePoolTaskAction('pool.install-patches', 'install_patches', pool =>
  pool.HA_enabled ? 'job:pool-install-patches:ha-enabled' : undefined
)
