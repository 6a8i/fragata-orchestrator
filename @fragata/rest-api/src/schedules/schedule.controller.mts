import type { XoSchedule } from '@fragata/types'
import {
  Body,
  Delete,
  Example,
  Extension,
  Get,
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
import { inject } from 'inversify'
import { provide } from 'inversify-binding-decorators'
import { json, type Request as ExRequest } from 'express'

import { acl } from '../middlewares/acl.middleware.mjs'
import {
  asynchronousActionResp,
  badRequestResp,
  createdResp,
  featureUnauthorized,
  invalidParameters,
  forbiddenOperationResp,
  internalServerErrorResp,
  noContentResp,
  notFoundResp,
  unauthorizedResp,
  type Unbrand,
} from '../open-api/common/response.common.mjs'
import { partialSchedules, schedule, scheduleIds } from '../open-api/oa-examples/schedule.oa-example.mjs'
import { taskLocation } from '../open-api/oa-examples/task.oa-example.mjs'
import type { SendObjects } from '../helpers/helper.type.mjs'
import { XoController } from '../abstract-classes/xo-controller.mjs'
import type { CreateActionReturnType } from '../abstract-classes/base-controller.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'

export type CreateScheduleBody = {
  jobId: string
  cron: string
  enabled: boolean
  name?: string
  timezone?: string
}

export type UpdateScheduleBody = Partial<Omit<CreateScheduleBody, 'jobId'>>

@Route('schedules')
@Security('*')
@Response(badRequestResp.status, badRequestResp.description)
@Response(unauthorizedResp.status, unauthorizedResp.description)
@Tags('schedules')
@provide(ScheduleController)
export class ScheduleController extends XoController<XoSchedule> {
  constructor(@inject(RestApi) restApi: RestApi) {
    super('schedule', restApi)
  }

  // --- abstract methods
  getAllCollectionObjects(): Promise<XoSchedule[]> {
    return this.restApi.xoApp.getAllSchedules()
  }
  getCollectionObject(id: XoSchedule['id']): Promise<XoSchedule> {
    return this.restApi.xoApp.getSchedule(id)
  }

  /**
   * Returns all schedules that match the following privilege:
   * - resource: schedule, action: read
   *
   * @example fields "enabled,jobId,cron,id"
   * @example filter "enabled?"
   * @example limit 42
   */
  @Example(scheduleIds)
  @Example(partialSchedules)
  @Extension('x-mcp-exposure', 'allow')
  @Get('')
  @Security('*', ['acl'])
  async getSchedules(
    @Request() req: ExRequest,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() markdown?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<Unbrand<XoSchedule>>> {
    return this.sendObjects(Object.values(await this.getObjects({ filter })), req, {
      limit,
      privilege: { action: 'read', resource: 'schedule' },
    })
  }

  /**
   *
   * Required privilege:
   * - resource: schedule, action: read
   *
   * @example id "cf7249f8-d20b-494f-97f4-b1f32f94e780"
   */
  @Example(schedule)
  @Extension('x-mcp-exposure', 'allow')
  @Get('{id}')
  @Middlewares(
    acl({
      resource: 'schedule',
      action: 'read',
      objectId: 'params.id',
      getObject:
        ({ restApi }) =>
        id =>
          restApi.xoApp.getSchedule(id),
    })
  )
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  async getSchedule(@Path() id: string): Promise<Unbrand<XoSchedule>> {
    return this.getObject(id as XoSchedule['id'])
  }

  /**
   *
   * Required privilege:
   * - resource: schedule, action: run
   *
   * @example id "cf7249f8-d20b-494f-97f4-b1f32f94e780"
   */
  @Example(taskLocation)
  @Extension('x-mcp-exposure', 'confirm')
  @Post('{id}/actions/run')
  @Middlewares(
    acl({
      resource: 'schedule',
      action: 'run',
      objectId: 'params.id',
      getObject:
        ({ restApi }) =>
        id =>
          restApi.xoApp.getSchedule(id),
    })
  )
  @SuccessResponse(asynchronousActionResp.status, asynchronousActionResp.description)
  @Response(noContentResp.status, noContentResp.description)
  @Response(featureUnauthorized.status, featureUnauthorized.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(internalServerErrorResp.status, internalServerErrorResp.description)
  async runSchedule(@Path() id: string, @Query() sync?: boolean): CreateActionReturnType<void> {
    const scheduleId = id as XoSchedule['id']
    const action = async () => {
      const xoApp = this.restApi.xoApp
      const schedule = await this.getObject(scheduleId)
      const job = await xoApp.getJob(schedule.jobId)
      await xoApp.runJob(job, schedule)
    }

    return this.createAction<void>(action, {
      sync,
      statusCode: noContentResp.status,
      taskProperties: { name: 'run schedule', objectId: scheduleId },
    })
  }


  /**
   * Creates a schedule for a job.
   *
   * Required privilege:
   * - resource: schedule, action: create
   */
  @Example({ id: 'cf7249f8-d20b-494f-97f4-b1f32f94e780' })
  @Extension('x-mcp-exposure', 'confirm')
  @Post('')
  @Middlewares([
    json(),
    acl({
      resource: 'schedule',
      action: 'create',
      object: ({ req }) => req.body,
    }),
  ])
  @SuccessResponse(createdResp.status, createdResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(invalidParameters.status, invalidParameters.description)
  async createSchedule(@Body() body: CreateScheduleBody): Promise<{ id: Unbrand<XoSchedule>['id'] }> {
    const schedule = await this.restApi.xoApp.createSchedule({
      ...body,
      jobId: body.jobId as XoSchedule['jobId'],
      userId: this.restApi.getCurrentUser().id,
    })

    return { id: schedule.id }
  }

  /**
   * Updates a schedule.
   *
   * Required privilege:
   * - resource: schedule, action: update
   *
   * @example id "cf7249f8-d20b-494f-97f4-b1f32f94e780"
   */
  @Extension('x-mcp-exposure', 'confirm')
  @Patch('{id}')
  @Middlewares([
    json(),
    acl({
      resource: 'schedule',
      action: 'update',
      objectId: 'params.id',
      getObject:
        ({ restApi }) =>
        id =>
          restApi.xoApp.getSchedule(id),
    }),
  ])
  @SuccessResponse(noContentResp.status, noContentResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(invalidParameters.status, invalidParameters.description)
  async updateSchedule(@Path() id: string, @Body() body: UpdateScheduleBody): Promise<void> {
    const scheduleId = id as XoSchedule['id']
    await this.getObject(scheduleId)
    await this.restApi.xoApp.updateSchedule({ ...body, id: scheduleId })
    this.setStatus(noContentResp.status)
  }

  /**
   * Deletes a schedule. The settings the job keeps for it are left as they are.
   *
   * Required privilege:
   * - resource: schedule, action: delete
   *
   * @example id "cf7249f8-d20b-494f-97f4-b1f32f94e780"
   */
  @Extension('x-mcp-exposure', 'confirm')
  @Delete('{id}')
  @Middlewares(
    acl({
      resource: 'schedule',
      action: 'delete',
      objectId: 'params.id',
      getObject:
        ({ restApi }) =>
        id =>
          restApi.xoApp.getSchedule(id),
    })
  )
  @SuccessResponse(noContentResp.status, noContentResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  async deleteSchedule(@Path() id: string): Promise<void> {
    const scheduleId = id as XoSchedule['id']
    await this.getObject(scheduleId)
    await this.restApi.xoApp.deleteSchedule(scheduleId)
    this.setStatus(noContentResp.status)
  }
}
