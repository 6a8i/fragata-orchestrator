import { Get, Middlewares, Path, Response, Route, Security, Tags } from 'tsoa'
import { inject } from 'inversify'
import { provide } from 'inversify-binding-decorators'
import { invalidParameters } from 'fragata-common/api-errors.js'
import type { XoHost, XoPbd, XoPool, XoSr } from '@fragata/types'

import { acl } from '../middlewares/acl.middleware.mjs'
import {
  badRequestResp,
  forbiddenOperationResp,
  invalidParameters as invalidParametersResp,
  notFoundResp,
  unauthorizedResp,
} from '../open-api/common/response.common.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'
import { XapiXoController } from '../abstract-classes/xapi-xo-controller.mjs'

/**
 * XOSTOR (LINSTOR) storage: hyperconverged SRs replicated between the hosts of a pool.
 */
@Route('srs')
@Security('*')
@Response(badRequestResp.status, badRequestResp.description)
@Response(unauthorizedResp.status, unauthorizedResp.description)
@Tags('srs')
@provide(SrXostorController)
export class SrXostorController extends XapiXoController<XoSr> {
  constructor(@inject(RestApi) restApi: RestApi) {
    super('SR', restApi)
  }

  /**
   * State of the LINSTOR nodes, storage pools and resources of a XOSTOR SR, from the `linstor-manager` plugin of
   * the primary host.
   *
   * Required privilege:
   * - resource: sr, action: read
   *
   * @example id "c787b75c-3e0d-70fa-d0c3-cbfd382d7e33"
   */
  @Get('{id}/xostor_health')
  @Middlewares(acl({ resource: 'sr', action: 'read', objectId: 'params.id' }))
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(invalidParametersResp.status, invalidParametersResp.description)
  async getXostorHealth(@Path() id: string): Promise<Record<string, unknown>> {
    const sr = this.getObject(id as XoSr['id'])
    if (sr.SR_type !== 'linstor') {
      throw invalidParameters('not a XOSTOR SR')
    }

    const xoApp = this.restApi.xoApp
    const pool = xoApp.getObject<XoPool>(sr.$pool)
    const master = xoApp.getObject<XoHost>(pool.master)
    const pbd = xoApp.getObject<XoPbd>(sr.$PBDs[0])
    const groupName = pbd.device_config['group-name']

    const xapi = this.getXapi(sr)
    const result = await xapi.callAsync<string>('host.call_plugin', master._xapiRef, 'linstor-manager', 'healthCheck', {
      groupName,
    })
    return JSON.parse(result)
  }
}
