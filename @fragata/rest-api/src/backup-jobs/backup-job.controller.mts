import {
  AnyXoBackupJob,
  XoVmBackupJob,
  XoMetadataBackupJob,
  XoMirrorBackupJob,
  AnyXoLog,
  XoBackupLog,
  XoSchedule,
  XoVm,
} from '@fragata/types'
import { createLogger } from '@fragata/log'
import { inject } from 'inversify'
import { noSuchObject } from 'fragata-common/api-errors.js'
import {
  Body,
  Delete,
  Deprecated,
  Example,
  Extension,
  Get,
  Hidden,
  Middlewares,
  Patch,
  Path,
  Post,
  Query,
  Request,
  Response,
  Route,
  Security,
  SuccessResponse,
  Tags,
} from 'tsoa'
import { json, type Request as ExRequest, type Response as ExResponse } from 'express'
import { provide } from 'inversify-binding-decorators'

import { acl, autoBindService } from '../middlewares/acl.middleware.mjs'
import { backupLog, backupLogIds, partialBackupLogs } from '../open-api/oa-examples/backup-log.oa-example.mjs'
import { BackupLogService } from '../backup-logs/backup-log.service.mjs'
import {
  asynchronousActionResp,
  badRequestResp,
  createdResp,
  forbiddenOperationResp,
  invalidParameters,
  noContentResp,
  notFoundResp,
  unauthorizedResp,
  Unbrand,
} from '../open-api/common/response.common.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'
import { BASE_URL, limitAndFilterArray, safeParseComplexMatcher } from '../helpers/utils.helper.mjs'
import type {
  CreateVmBackupJobBody,
  RunBackupJobBody,
  UnbrandAnyXoBackupJob,
  UnbrandXoMetadataBackupJob,
  UnbrandXoMirrorBackupJob,
  UnbrandXoVmBackupJob,
  UpdateVmBackupJobBody,
} from './backup-job.type.mjs'
import type { CreateActionReturnType } from '../abstract-classes/base-controller.mjs'
import { ApiError } from '../helpers/error.helper.mjs'
import { taskLocation } from '../open-api/oa-examples/task.oa-example.mjs'
import { SendObjects } from '../helpers/helper.type.mjs'
import { XoController } from '../abstract-classes/xo-controller.mjs'
import {
  metadataBackupJob,
  metadataBackupJobIds,
  mirrorBackupJob,
  mirrorBackupJobIds,
  partialMetadataBackupJobs,
  partialMirrorBackupJobs,
  partialVmBackupJobs,
  vmBackupJob,
  vmBackupJobIds,
} from '../open-api/oa-examples/backup-job.oa-example.mjs'
import { BackupJobService } from './backup-job.service.mjs'

const log = createLogger('xo:rest-api:backupJob-controller')

@Route('backup-jobs')
@Security('*')
@Response(badRequestResp.status, badRequestResp.description)
@Response(unauthorizedResp.status, unauthorizedResp.description)
@Tags('backup-jobs')
@provide(BackupJobController)
export class BackupJobController extends XoController<AnyXoBackupJob> {
  #backupJobService: BackupJobService

  constructor(@inject(RestApi) restApi: RestApi, @inject(BackupJobService) backupJobService: BackupJobService) {
    super('backup-job', restApi)
    this.#backupJobService = backupJobService
  }

  async getAllCollectionObjects(): Promise<AnyXoBackupJob[]> {
    const allJobs = await this.restApi.xoApp.getAllJobs()
    const backupJobs = allJobs.filter(job => this.#backupJobService.isBackupJob(job))
    return backupJobs
  }

  getCollectionObject(id: AnyXoBackupJob['id']): Promise<AnyXoBackupJob> {
    return this.#backupJobService.getBackupJob(id)
  }

  /**
   * Returns all backup jobs that match the following privilege:
   * - resource: backup-job, action: read
   *
   * @example fields "name,mode,type,id"
   * @example filter "type:backup"
   * @example limit 42
   */
  @Example(vmBackupJobIds)
  @Example(partialVmBackupJobs)
  @Extension('x-mcp-exposure', 'allow')
  @Get('')
  @Security('*', ['acl'])
  async getBackupJobs(
    @Request() req: ExRequest,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() markdown?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<UnbrandAnyXoBackupJob>> {
    const backupJobs = await this.getObjects({ filter })
    return this.sendObjects(Object.values(backupJobs), req, {
      path: 'backup-jobs',
      limit,
      privilege: { action: 'read', resource: 'backup-job' },
    })
  }

  /**
   *
   * Required privilege:
   * - resource: backup-job, action: read
   *
   * @example id "d33f3dc1-92b4-469c-ad58-4c2a106a4721"
   */
  @Example(vmBackupJob)
  @Extension('x-mcp-exposure', 'allow')
  @Get('{id}')
  @Middlewares(
    acl({
      resource: 'backup-job',
      action: 'read',
      objectId: 'params.id',
      getObject: autoBindService(BackupJobService, 'getBackupJob'),
    })
  )
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  getBackupJob(@Path() id: string): Promise<UnbrandAnyXoBackupJob> {
    return this.getObject(id as AnyXoBackupJob['id'])
  }

  /**
   * Creates a VM backup job. Schedules are created with it: each one is keyed
   * by a temporary id, and its settings go under the same key in `settings`.
   *
   * Required privilege:
   * - resource: backup-job, action: create
   */
  @Example({ id: 'd33f3dc1-92b4-469c-ad58-4c2a106a4721' })
  @Extension('x-mcp-exposure', 'confirm')
  @Post('vm')
  @Middlewares([
    json(),
    acl({
      resource: 'backup-job',
      action: 'create',
      object: ({ req }) => req.body,
    }),
  ])
  @SuccessResponse(createdResp.status, createdResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(invalidParameters.status, invalidParameters.description)
  async createVmBackupJob(@Body() body: CreateVmBackupJobBody): Promise<{ id: Unbrand<XoVmBackupJob>['id'] }> {
    const { schedules, ...props } = body
    const job = await this.restApi.xoApp.createBackupNgJob(
      'backup',
      props as unknown as Omit<XoVmBackupJob, 'id' | 'type'>,
      schedules
    )

    return { id: job.id }
  }

  /**
   * Updates a VM backup job. `settings` replaces the whole settings object:
   * send every schedule entry, not only the changed ones.
   *
   * Required privilege:
   * - resource: backup-job, action: update
   *
   * @example id "d33f3dc1-92b4-469c-ad58-4c2a106a4721"
   */
  @Extension('x-mcp-exposure', 'confirm')
  @Patch('vm/{id}')
  @Middlewares([
    json(),
    acl({
      resource: 'backup-job',
      action: 'update',
      objectId: 'params.id',
      getObject: autoBindService(BackupJobService, 'getBackupJob'),
    }),
  ])
  @SuccessResponse(noContentResp.status, noContentResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(invalidParameters.status, invalidParameters.description)
  async updateVmBackupJob(@Path() id: string, @Body() body: UpdateVmBackupJobBody): Promise<void> {
    const jobId = id as XoVmBackupJob['id']
    const job = await this.getObject(jobId)
    if (job.type !== 'backup') {
      throw noSuchObject(jobId, 'backup-job')
    }

    await this.restApi.xoApp.updateJob({ ...body, id: jobId })
    this.setStatus(noContentResp.status)
  }

  /**
   * Deletes a backup job and its schedules.
   *
   * Required privilege:
   * - resource: backup-job, action: delete
   *
   * @example id "d33f3dc1-92b4-469c-ad58-4c2a106a4721"
   */
  @Extension('x-mcp-exposure', 'confirm')
  @Delete('{id}')
  @Middlewares(
    acl({
      resource: 'backup-job',
      action: 'delete',
      objectId: 'params.id',
      getObject: autoBindService(BackupJobService, 'getBackupJob'),
    })
  )
  @SuccessResponse(noContentResp.status, noContentResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  async deleteBackupJob(@Path() id: string): Promise<void> {
    const jobId = id as AnyXoBackupJob['id']
    const job = await this.getObject(jobId)

    await this.restApi.xoApp.deleteBackupNgJob(jobId, job.type)
    this.setStatus(noContentResp.status)
  }

  /**
   * Runs a backup job now, with one of its schedules (the first one by default).
   *
   * Required privilege:
   * - resource: backup-job, action: run
   *
   * @example id "d33f3dc1-92b4-469c-ad58-4c2a106a4721"
   */
  @Example(taskLocation)
  @Extension('x-mcp-exposure', 'confirm')
  @Post('{id}/actions/run')
  @Middlewares([
    json(),
    acl({
      resource: 'backup-job',
      action: 'run',
      objectId: 'params.id',
      getObject: autoBindService(BackupJobService, 'getBackupJob'),
    }),
  ])
  @SuccessResponse(asynchronousActionResp.status, asynchronousActionResp.description)
  @Response(noContentResp.status, noContentResp.description)
  @Response(badRequestResp.status, badRequestResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  async runBackupJob(
    @Path() id: string,
    @Body() body: RunBackupJobBody,
    @Query() sync?: boolean
  ): CreateActionReturnType<void> {
    const jobId = id as AnyXoBackupJob['id']
    const xoApp = this.restApi.xoApp
    const job = await this.getObject(jobId)

    let schedule: XoSchedule | undefined
    if (body.scheduleId !== undefined) {
      schedule = await xoApp.getSchedule(body.scheduleId as XoSchedule['id'])
      if (schedule.jobId !== job.id) {
        throw new ApiError('the schedule does not belong to this job', 400)
      }
    } else {
      schedule = (await xoApp.getAllSchedules()).find(_schedule => _schedule.jobId === job.id)
      if (schedule === undefined) {
        throw new ApiError('this job has no schedule: create one before running it', 400)
      }
    }

    const action = async () => {
      await xoApp.runJobSequence([job.id], schedule, { vms: body.vms as XoVm['id'][] | undefined })
    }

    return this.createAction<void>(action, {
      sync,
      statusCode: noContentResp.status,
      taskProperties: { name: 'run backup job', objectId: jobId },
    })
  }
}

// ----------- DEPRECATED TO BE REMOVED IN ONE YEAR  (09-12-2026)--------------------
@Route('backup')
@Security('*')
@Response(badRequestResp.status, badRequestResp.description)
@Response(unauthorizedResp.status, unauthorizedResp.description)
@Middlewares((_req, _res, next) => {
  log.warn(
    'You are calling a deprecated route. It will be removed in the futur. Please use `/rest/v0/backup-jobs` or `/rest/v0/backup-logs` instead'
  )
  next()
})
@provide(DeprecatedBackupController)
export class DeprecatedBackupController extends XoController<AnyXoBackupJob> {
  #backupLogService: BackupLogService
  #backupJobService: BackupJobService

  constructor(
    @inject(RestApi) restApi: RestApi,
    @inject(BackupLogService) backupLogService: BackupLogService,
    @inject(BackupJobService) backupJobService: BackupJobService
  ) {
    super('backup', restApi)
    this.#backupLogService = backupLogService
    this.#backupJobService = backupJobService
  }

  async getAllCollectionObjects(): Promise<AnyXoBackupJob[]> {
    const backupJobs = await this.restApi.xoApp.getAllJobs()
    return backupJobs.filter(job => this.#backupJobService.isBackupJob(job))
  }

  async getCollectionObject(id: AnyXoBackupJob['id']): Promise<AnyXoBackupJob> {
    const backupJob = await this.restApi.xoApp.getJob(id)
    if (!this.#backupJobService.isBackupJob(backupJob)) {
      throw noSuchObject(id, 'backup-job')
    }

    return backupJob
  }

  override async getObject<T extends AnyXoBackupJob>(id: T['id']): Promise<AnyXoBackupJob>
  override async getObject<T extends AnyXoBackupJob>(
    id: T['id'],
    type: T['type']
  ): Promise<Extract<AnyXoBackupJob, { type: T }>>
  override async getObject<T extends AnyXoBackupJob>(id: T['id'], type?: T['type']): Promise<AnyXoBackupJob> {
    const backupJob = await super.getObject(id)
    if (backupJob.type !== type) {
      throw noSuchObject(id, type)
    }

    return backupJob
  }

  /**
   * Returns all VM backup jobs that match the following privilege:
   * - resource: backup-job, action: read
   *
   * @example fields "name,mode,id"
   * @example filter "mode:delta"
   * @example limit 42
   */
  @Example(vmBackupJobIds)
  @Example(partialVmBackupJobs)
  @Deprecated()
  @Extension('x-mcp-exposure', 'allow')
  @Get('jobs/vm')
  @Security('*', ['acl'])
  @Tags('backup-jobs')
  async getVmBackupJobs(
    @Request() req: ExRequest,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() markdown?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<UnbrandXoVmBackupJob>> {
    const vmBackupJobs = await this.restApi.xoApp.getAllJobs('backup')
    return this.sendObjects(limitAndFilterArray(vmBackupJobs, { filter }), req, {
      path: 'backup-jobs',
      limit,
      privilege: { action: 'read', resource: 'backup-job' },
    })
  }

  // For compatibility, redirect /backup/jobs/:id to /backup/jobs/vm/:id
  @Hidden()
  @Extension('x-mcp-exposure', 'allow')
  @Get('jobs/{id}')
  @Tags('backup-jobs')
  async redirectToVmBackupJob(@Request() req: ExRequest, @Path() id: string) {
    const res = req.res as ExResponse
    res.redirect(308, BASE_URL + '/backup/jobs/vm/' + id)
  }

  /**
   * @example id "d33f3dc1-92b4-469c-ad58-4c2a106a4721"
   */
  @Example(vmBackupJob)
  @Deprecated()
  @Response(notFoundResp.status, notFoundResp.description)
  @Extension('x-mcp-exposure', 'allow')
  @Get('jobs/vm/{id}')
  @Tags('backup-jobs')
  getVmBackupJob(@Path() id: string): Promise<UnbrandXoVmBackupJob> {
    return this.getObject(id as XoVmBackupJob['id'], 'backup')
  }

  /**
   * Returns all metadata backup jobs that match the following privilege:
   * - resource: backup-job, action: read
   *
   * @example fields "name,xoMetadata,id"
   * @example filter "xoMetadata?"
   * @example limit 42
   */
  @Example(metadataBackupJobIds)
  @Example(partialMetadataBackupJobs)
  @Deprecated()
  @Extension('x-mcp-exposure', 'allow')
  @Get('jobs/metadata')
  @Security('*', ['acl'])
  @Tags('backup-jobs')
  async getMetadataBackupJobs(
    @Request() req: ExRequest,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() markdown?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<UnbrandXoMetadataBackupJob>> {
    const metadataBackupJobs = await this.restApi.xoApp.getAllJobs('metadataBackup')
    return this.sendObjects(limitAndFilterArray(metadataBackupJobs, { filter }), req, {
      path: 'backup-jobs',
      limit,
      privilege: { action: 'read', resource: 'backup-job' },
    })
  }

  /**
   * @example id "b50f95fd-f6b7-4027-87b6-6a02c7dcd5f5"
   */
  @Example(metadataBackupJob)
  @Deprecated()
  @Response(notFoundResp.status, notFoundResp.description)
  @Extension('x-mcp-exposure', 'allow')
  @Get('jobs/metadata/{id}')
  @Tags('backup-jobs')
  getMetadataBackupJob(@Path() id: string): Promise<UnbrandXoMetadataBackupJob> {
    return this.getObject(id as XoMetadataBackupJob['id'], 'metadataBackup')
  }

  /**
   * Returns all mirror backup jobs that match the following privilege:
   * - resource: backup-job, action: read
   *
   * @example fields "name,mode,id"
   * @example filter "mode:delta"
   * @example limit 42
   */
  @Example(mirrorBackupJobIds)
  @Example(partialMirrorBackupJobs)
  @Deprecated()
  @Extension('x-mcp-exposure', 'allow')
  @Get('jobs/mirror')
  @Security('*', ['acl'])
  @Tags('backup-jobs')
  async getMirrorBackupJobs(
    @Request() req: ExRequest,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() markdown?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<UnbrandXoMirrorBackupJob>> {
    const mirrorBackupJobs = await this.restApi.xoApp.getAllJobs('mirrorBackup')
    return this.sendObjects(limitAndFilterArray(mirrorBackupJobs, { filter }), req, {
      path: 'backup-jobs',
      limit,
      privilege: { action: 'read', resource: 'backup-job' },
    })
  }

  /**
   * @example id "e680c14c-ab52-45c8-bb0e-bd4ca12ea8f9"
   */
  @Example(mirrorBackupJob)
  @Deprecated()
  @Response(notFoundResp.status, notFoundResp.description)
  @Extension('x-mcp-exposure', 'allow')
  @Get('jobs/mirror/{id}')
  @Tags('backup-jobs')
  getMirrorBackupJob(@Path() id: string): Promise<UnbrandXoMirrorBackupJob> {
    return this.getObject(id as XoMirrorBackupJob['id'], 'mirrorBackup')
  }

  /**
   * Returns all backup logs that match the following privilege:
   * - resource: backup-log, action: read
   *
   * @example fields "jobName,status,data"
   * @example filter "status:success"
   * @example limit 42
   */
  @Example(backupLogIds)
  @Example(partialBackupLogs)
  @Deprecated()
  @Extension('x-mcp-exposure', 'allow')
  @Get('logs')
  @Security('*', ['acl'])
  @Tags('backup-logs')
  async getDeprecatedBackupLogs(
    @Request() req: ExRequest,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() markdown?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<Unbrand<XoBackupLog>>> {
    const userFilter = filter === undefined ? () => true : safeParseComplexMatcher(filter).createPredicate()

    const predicate = (log: AnyXoLog) => {
      if (!this.#backupLogService.isBackupLog(log)) {
        return false
      }

      return userFilter(log)
    }
    const logs = (await this.restApi.xoApp.getBackupNgLogsSorted({ filter: predicate })) as XoBackupLog[]
    return this.sendObjects(logs, req, {
      path: 'backup-logs',
      limit,
      privilege: { action: 'read', resource: 'backup-log' },
    })
  }

  /**
   * @example id "1753776067468"
   */
  @Example(backupLog)
  @Deprecated()
  @Extension('x-mcp-exposure', 'allow')
  @Get('logs/{id}')
  @Tags('backup-logs')
  async getDeprecatedBackupLog(@Path() id: string): Promise<Unbrand<XoBackupLog>> {
    const log = await this.restApi.xoApp.getBackupNgLogs(id as XoBackupLog['id'])
    if (!this.#backupLogService.isBackupLog(log)) {
      throw noSuchObject('backup-log')
    }

    return log
  }
}
// ----------- DEPRECATED TO BE REMOVED IN ONE YEAR  (09-12-2026)--------------------
