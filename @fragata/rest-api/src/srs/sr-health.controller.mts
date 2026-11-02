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
 * Health of SRs: the chains of their VDIs, and the state of XOSTOR (LINSTOR) SRs.
 */
@Route('srs')
@Security('*')
@Response(badRequestResp.status, badRequestResp.description)
@Response(unauthorizedResp.status, unauthorizedResp.description)
@Tags('srs')
@provide(SrHealthController)
export class SrHealthController extends XapiXoController<XoSr> {
  constructor(@inject(RestApi) restApi: RestApi) {
    super('SR', restApi)
  }

  /**
   * Chains of VDIs (VHD) waiting to be coalesced: a long chain slows down the disk and blocks snapshots.
   * `unhealthyVdis` gives, by VDI UUID, the number of parents to coalesce; `vdisWithUnknownVhdParent` the VDIs whose
   * parent is missing.
   *
   * Required privilege:
   * - resource: sr, action: read
   *
   * @example id "c787b75c-3e0d-70fa-d0c3-cbfd382d7e33"
   */
  @Get('{id}/vdi_chains')
  @Middlewares(acl({ resource: 'sr', action: 'read', objectId: 'params.id' }))
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  getSrVdiChains(@Path() id: string): {
    unhealthyVdis: Record<string, number>
    vdisWithUnknownVhdParent: Record<string, string>
    nUnhealthyVdis: number
  } {
    const sr = this.getObject(id as XoSr['id'])
    const xapi = this.getXapi(sr) as unknown as {
      getVdiChainsInfo(sr: string): {
        unhealthyVdis: Record<string, number>
        vdisWithUnknownVhdParent: Record<string, string>
        nUnhealthyVdis: number
      }
    }
    return xapi.getVdiChainsInfo(sr._xapiRef)
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
