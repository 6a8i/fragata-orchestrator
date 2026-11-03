import {
  Body,
  Example,
  Extension,
  Middlewares,
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
import type { XoPool, XoSr } from '@fragata/types'

import { acl } from '../middlewares/acl.middleware.mjs'
import {
  asynchronousActionResp,
  badRequestResp,
  createdResp,
  forbiddenOperationResp,
  internalServerErrorResp,
  invalidParameters as invalidParametersResp,
  notFoundResp,
  unauthorizedResp,
} from '../open-api/common/response.common.mjs'
import { srId } from '../open-api/oa-examples/sr.oa-example.mjs'
import { taskLocation } from '../open-api/oa-examples/task.oa-example.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'
import { XapiXoController } from '../abstract-classes/xapi-xo-controller.mjs'
import type { CreateActionReturnType } from '../abstract-classes/base-controller.mjs'
import { SrService, type CreateXostorBody } from '../srs/sr.service.mjs'

/**
 * XOSTOR (LINSTOR hyperconverged storage) SRs of a pool.
 */
@Route('pools')
@Security('*')
@Response(badRequestResp.status, badRequestResp.description)
@Response(unauthorizedResp.status, unauthorizedResp.description)
@Tags('pools')
@provide(PoolXostorController)
export class PoolXostorController extends XapiXoController<XoPool> {
  #srService: SrService

  constructor(@inject(RestApi) restApi: RestApi, @inject(SrService) srService: SrService) {
    super('pool', restApi)
    this.#srService = srService
  }

  /**
   * Creates a XOSTOR SR, replicated with LINSTOR/DRBD over the disks of several hosts of the pool:
   * 1. installs the LINSTOR packages (`xcp-ng-linstor` and its dependencies) from the package channel of the hosts
   *    on the hosts where they are missing, then restarts their toolstack (the pool master last); HA must be disabled
   * 2. formats the given disks of each host into the `linstor_group` LVM volume group (with a thin pool when
   *    `provisioning` is `thin`)
   * 3. creates the shared `linstor` SR, keeping `replication` copies of each volume
   * 4. optionally creates a LINSTOR interface on `preferredInterface.networkId` and makes it the preferred one
   *
   * Administrators only (the `xostor.create` API method requires the `admin` permission). No license is needed.
   *
   * `disksByHost` gives, by host ID, the device paths to use (see `GET /hosts/{id}/block_devices`): disks without
   * partitions, not mounted. `replication` must be between 1 and the number of hosts with disks.
   *
   * The result of the task (or of a `sync` call, with a `201` status) is `{ id }`, the UUID of the new SR.
   *
   * Required privileges:
   * - resource: pool, action: create:sr
   * - resource: sr, action: create
   *
   * @example id "355ee47d-ff4c-4924-3db2-fd86ae629676"
   * @example body {
   *    "name_label": "XOSTOR",
   *    "name_description": "Replicated storage",
   *    "disksByHost": {
   *      "b61a5c92-700e-4966-a13b-00633f03eea8": ["/dev/sdb"],
   *      "c4284e12-37c9-7967-b9e8-83ef229c3e03": ["/dev/sdb", "/dev/sdc"],
   *      "f8b8d2a5-7d40-a104-efc6-fb797b58f258": ["/dev/nvme0n1"]
   *    },
   *    "provisioning": "thin",
   *    "replication": 2
   * }
   */
  @Example(taskLocation)
  @Example(srId)
  @Extension('x-mcp-exposure', 'confirm')
  @Post('{id}/actions/create_xostor')
  @Middlewares([
    json(),
    acl([
      { resource: 'pool', action: 'create:sr', objectId: 'params.id' },
      { resource: 'sr', action: 'create', object: ({ req }) => req.body },
    ]),
  ])
  @Tags('srs')
  @SuccessResponse(asynchronousActionResp.status, asynchronousActionResp.description)
  @Response(createdResp.status, createdResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(invalidParametersResp.status, invalidParametersResp.description)
  @Response(internalServerErrorResp.status, internalServerErrorResp.description)
  createXostor(
    @Path() id: string,
    @Body() body: CreateXostorBody,
    @Request() req: ExRequest,
    @Query() sync?: boolean
  ): CreateActionReturnType<{ id: string }> {
    const poolId = id as XoPool['id']
    // answer invalid requests before starting a task
    const params = this.#srService.prepareXostorCreation(poolId, body)

    const action = async () => {
      const srId: XoSr['id'] = await this.#srService.createXostor(params, { remoteAddress: req.ip })
      return { id: srId }
    }

    return this.createAction<{ id: string }>(action, {
      sync,
      statusCode: createdResp.status,
      taskProperties: {
        name: `create XOSTOR ${body.name_label}`,
        objectId: poolId,
        params: body,
      },
    })
  }
}
