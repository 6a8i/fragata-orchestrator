import { Body, Example, Middlewares, Path, Post, Query, Response, Route, Security, SuccessResponse, Tags } from 'tsoa'
import { inject } from 'inversify'
import { provide } from 'inversify-binding-decorators'
import { json } from 'express'
import { invalidParameters } from 'fragata-common/api-errors.js'
import type { XoNetwork, XoPool, XoSr, XoVmTemplate } from '@fragata/types'

import {
  asynchronousActionResp,
  badRequestResp,
  invalidParameters as invalidParametersResp,
  notFoundResp,
  unauthorizedResp,
} from '../open-api/common/response.common.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'
import { XapiXoController } from '../abstract-classes/xapi-xo-controller.mjs'
import type { CreateActionReturnType } from '../abstract-classes/base-controller.mjs'
import { taskLocation } from '../open-api/oa-examples/task.oa-example.mjs'
import type { EsxiConnectionBody, EsxiVm, ImportFromEsxiBody, ImportFromEsxiResult } from './pool-esxi-import.type.mjs'

/**
 * Import of VMs from VMware ESXi or vCenter into a pool. Administrators only.
 */
@Route('pools')
@Security('*')
@Response(badRequestResp.status, badRequestResp.description)
@Response(unauthorizedResp.status, unauthorizedResp.description)
@Tags('pools')
@provide(PoolEsxiImportController)
export class PoolEsxiImportController extends XapiXoController<XoPool> {
  constructor(@inject(RestApi) restApi: RestApi) {
    super('pool', restApi)
  }

  #checkInPool(poolId: XoPool['id'], objectId: string, type: string) {
    const object = this.restApi.xoApp.getObject(objectId as XoSr['id']) as { $pool?: string; type: string }
    if (object.type !== type || object.$pool !== poolId) {
      throw invalidParameters(`${objectId} is not a ${type} of the pool`)
    }
  }

  /**
   * VMs of the VMware host, to choose the ones to import.
   *
   * @example id "355ee47d-ff4c-4924-3db2-fd86ae629677"
   * @example body { "host": "esxi.lan", "user": "root", "password": "secret", "sslVerify": false }
   */
  @Post('{id}/actions/list_esxi_vms')
  @Middlewares(json())
  @Response(notFoundResp.status, notFoundResp.description)
  async listEsxiVms(@Path() id: string, @Body() body: EsxiConnectionBody): Promise<EsxiVm[]> {
    this.getObject(id as XoPool['id'])
    return this.restApi.xoApp.connectToEsxiAndList(body)
  }

  /**
   * Imports VMs one after the other: each one gets the disks on the SR, its VIFs on the network and the settings
   * of the template. A VM still running is copied while running, then stopped for a last delta when `stopSource`.
   *
   * @example id "355ee47d-ff4c-4924-3db2-fd86ae629677"
   * @example body { "host": "esxi.lan", "user": "root", "password": "secret", "sslVerify": false, "vms": ["vm-42"], "sr": "c787b75c-3e0d-70fa-d0c3-cbfd382d7e33", "network": "6b6ca0f5-6611-0636-4b0a-1fb1c815e969", "template": "b6cc7b0f-7a07-4a8d-bde6-7a95ea1a1b8e" }
   */
  @Example(taskLocation)
  @Post('{id}/actions/import_from_esxi')
  @Middlewares(json())
  @SuccessResponse(asynchronousActionResp.status, asynchronousActionResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(invalidParametersResp.status, invalidParametersResp.description)
  async importFromEsxi(
    @Path() id: string,
    @Body() body: ImportFromEsxiBody,
    @Query() sync?: boolean
  ): CreateActionReturnType<ImportFromEsxiResult> {
    const poolId = id as XoPool['id']
    this.getObject(poolId)
    if (body.vms.length === 0) {
      throw invalidParameters('no VM to import')
    }
    this.#checkInPool(poolId, body.sr, 'SR')
    this.#checkInPool(poolId, body.network, 'network')
    this.#checkInPool(poolId, body.template, 'VM-template')

    const { vms, ...connection } = body
    return this.createAction<ImportFromEsxiResult>(
      async () => {
        const result: ImportFromEsxiResult = { imported: {}, errors: {} }
        for (const vm of vms) {
          try {
            result.imported[vm] = await this.restApi.xoApp.migrationfromEsxi({
              ...connection,
              vm,
              sr: body.sr as XoSr['id'],
              network: body.network as XoNetwork['id'],
              template: body.template as XoVmTemplate['id'],
            })
          } catch (error) {
            result.errors[vm] = (error as Error).message
          }
        }
        if (Object.keys(result.imported).length === 0) {
          throw new Error(`no VM imported: ${Object.values(result.errors).join(', ')}`)
        }
        return result
      },
      {
        sync,
        taskProperties: { name: `import ${vms.length} VMs from ${body.host}`, objectId: poolId },
      }
    )
  }
}
