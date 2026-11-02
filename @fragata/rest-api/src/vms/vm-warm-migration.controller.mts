import { Body, Example, Middlewares, Path, Post, Query, Response, Route, Security, SuccessResponse, Tags } from 'tsoa'
import { inject } from 'inversify'
import { provide } from 'inversify-binding-decorators'
import { json } from 'express'
import type { XoSr, XoVm } from '@fragata/types'

import {
  asynchronousActionResp,
  badRequestResp,
  noContentResp,
  notFoundResp,
  unauthorizedResp,
} from '../open-api/common/response.common.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'
import { XapiXoController } from '../abstract-classes/xapi-xo-controller.mjs'
import type { CreateActionReturnType } from '../abstract-classes/base-controller.mjs'
import { taskLocation } from '../open-api/oa-examples/task.oa-example.mjs'
import type { WarmMigrateVmBody } from './vm-warm-migration.type.mjs'

/**
 * Warm migration: moves a VM to an SR of another pool with a short downtime. The disks are copied while the VM runs,
 * then the VM is stopped for a last copy of what changed. Administrators only.
 */
@Route('vms')
@Security('*')
@Response(badRequestResp.status, badRequestResp.description)
@Response(unauthorizedResp.status, unauthorizedResp.description)
@Tags('vms')
@provide(VmWarmMigrationController)
export class VmWarmMigrationController extends XapiXoController<XoVm> {
  constructor(@inject(RestApi) restApi: RestApi) {
    super('VM', restApi)
  }

  /**
   * The source VM is kept (halted) unless `deleteSourceVm`.
   *
   * @example id "f07ab729-c0e8-721c-45ec-f11276377030"
   * @example body { "srId": "c3b86663-a3ca-6c17-a7df-b79902353b60", "startDestinationVm": true, "deleteSourceVm": false }
   */
  @Example(taskLocation)
  @Post('{id}/actions/warm_migrate')
  @Middlewares(json())
  @SuccessResponse(asynchronousActionResp.status, asynchronousActionResp.description)
  @Response(noContentResp.status, noContentResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  warmMigrateVm(
    @Path() id: string,
    @Body() body: WarmMigrateVmBody,
    @Query() sync?: boolean
  ): CreateActionReturnType<void> {
    const vmId = id as XoVm['id']
    this.getObject(vmId)
    this.restApi.getObject<XoSr>(body.srId as XoSr['id'], 'SR')

    return this.createAction<void>(
      async () => {
        await this.restApi.xoApp.warmMigrateVm(
          vmId,
          body.srId as XoSr['id'],
          body.startDestinationVm ?? true,
          body.deleteSourceVm ?? false
        )
      },
      {
        sync,
        statusCode: noContentResp.status,
        taskProperties: { name: 'warm migration', objectId: vmId, params: body },
      }
    )
  }
}
