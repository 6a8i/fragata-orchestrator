import { createPredicate } from 'value-matcher'
import { extractIdsFromSimplePattern } from '@fragata/backups/extractIdsFromSimplePattern.mjs'
import { noSuchObject } from 'fragata-common/api-errors.js'
import type { XoVmBackupJob, XoVm, XoSchedule, AnyXoJob, AnyXoBackupJob } from '@fragata/types'

import type { RestApi } from '../rest-api/rest-api.mjs'
import { vmContainsNoBakTag } from '../helpers/utils.helper.mjs'

export class BackupJobService {
  #backupJobTypes = ['backup', 'metadataBackup', 'mirrorBackup']
  #restApi: RestApi

  constructor(restApi: RestApi) {
    this.#restApi = restApi
  }

  async getBackupJob(id: AnyXoBackupJob['id']): Promise<AnyXoBackupJob> {
    const job = await this.#restApi.xoApp.getJob(id)
    if (!this.isBackupJob(job)) {
      throw noSuchObject(id, 'backup-job')
    }

    return job
  }

  isBackupJob(anyJob: AnyXoJob): anyJob is AnyXoBackupJob {
    return this.#backupJobTypes.includes(anyJob.type)
  }

  async isVmInBackupJob(backupJobOrId: XoVmBackupJob['id'] | XoVmBackupJob, vmId: XoVm['id']): Promise<boolean> {
    // callers iterating all the jobs already hold them: do not fetch each one again
    const backupJob =
      typeof backupJobOrId === 'string' ? await this.#restApi.xoApp.getJob<XoVmBackupJob>(backupJobOrId) : backupJobOrId
    const vm = this.#restApi.getObject<XoVm>(vmId, 'VM')

    if (vmContainsNoBakTag(vm)) {
      return false
    }

    try {
      const vmIds: XoVm['id'][] = extractIdsFromSimplePattern(backupJob.vms)
      return vmIds.some(id => id === vm.id)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_) {
      const predicate = createPredicate(backupJob.vms)
      return predicate(vm)
    }
  }

  async backupJobHasAtLeastOneScheduleEnabled(backupJobOrId: XoVmBackupJob['id'] | XoVmBackupJob): Promise<boolean> {
    const backupJob =
      typeof backupJobOrId === 'string' ? await this.#restApi.xoApp.getJob<XoVmBackupJob>(backupJobOrId) : backupJobOrId

    for (const maybeScheduleId in backupJob.settings) {
      if (maybeScheduleId === '') {
        continue
      }

      try {
        const schedule = await this.#restApi.xoApp.getSchedule(maybeScheduleId as XoSchedule['id'])
        if (schedule.enabled) {
          return true
        }

        const scheduleSequence = await this.#restApi.xoApp.findEnabledScheduleSequenceFromSchedule(schedule.id)
        if (scheduleSequence !== undefined) {
          return true
        }
      } catch (error) {
        if (!noSuchObject.is(error, { id: maybeScheduleId, type: 'schedule' })) {
          console.error(error)
        }
        continue
      }
    }
    return false
  }
}
