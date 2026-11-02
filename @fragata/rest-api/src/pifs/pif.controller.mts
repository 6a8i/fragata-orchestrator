import {
  Body,
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
import { invalidParameters } from 'fragata-common/api-errors.js'
import type { XoAlarm, XoMessage, XoPif, XoTask } from '@fragata/types'

import { AlarmService } from '../alarms/alarm.service.mjs'
import { escapeUnsafeComplexMatcher } from '../helpers/utils.helper.mjs'
import { acl, actionsFromBody } from '../middlewares/acl.middleware.mjs'
import type { CreateActionReturnType } from '../abstract-classes/base-controller.mjs'
import type { ReconfigurePifIpBody, UpdatePifBody } from './pif.type.mjs'
import { genericAlarmsExample } from '../open-api/oa-examples/alarm.oa-example.mjs'
import {
  asynchronousActionResp,
  badRequestResp,
  forbiddenOperationResp,
  invalidParameters as invalidParametersResp,
  noContentResp,
  notFoundResp,
  unauthorizedResp,
  type Unbrand,
} from '../open-api/common/response.common.mjs'
import { partialPifs, pif, pifIds } from '../open-api/oa-examples/pif.oa-example.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'
import type { SendObjects } from '../helpers/helper.type.mjs'
import { XapiXoController } from '../abstract-classes/xapi-xo-controller.mjs'
import { messageIds, partialMessages } from '../open-api/oa-examples/message.oa-example.mjs'
import { partialTasks, taskIds, taskLocation } from '../open-api/oa-examples/task.oa-example.mjs'

type UnbrandedXoPif = Unbrand<XoPif>

@Route('pifs')
@Security('*')
@Response(badRequestResp.status, badRequestResp.description)
@Response(unauthorizedResp.status, unauthorizedResp.description)
@Tags('pifs')
@provide(PifController)
export class PifController extends XapiXoController<XoPif> {
  #alarmService: AlarmService
  constructor(@inject(RestApi) restApi: RestApi, @inject(AlarmService) alarmService: AlarmService) {
    super('PIF', restApi)
    this.#alarmService = alarmService
  }

  /**
   * Returns all PIFs that match the following privilege:
   * - resource: pif, action: read
   *
   * @example fields "attached,device,deviceName,id"
   * @example filter "attached?"
   * @example limit 42
   */
  @Example(pifIds)
  @Example(partialPifs)
  @Extension('x-mcp-exposure', 'allow')
  @Get('')
  @Security('*', ['acl'])
  getPifs(
    @Request() req: ExRequest,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() markdown?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<UnbrandedXoPif>> {
    return this.sendObjects(Object.values(this.getObjects({ filter })), req, {
      limit,
      privilege: { action: 'read', resource: 'pif' },
    })
  }

  /**
   * Required privilege:
   * - resource: pif, action: read
   *
   * @example id "d9e42451-3794-089f-de81-4ee0e6137bee"
   */
  @Example(pif)
  @Extension('x-mcp-exposure', 'allow')
  @Get('{id}')
  @Middlewares(acl({ resource: 'pif', action: 'read', objectId: 'params.id' }))
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  getPif(@Path() id: string): UnbrandedXoPif {
    return this.getObject(id as XoPif['id'])
  }

  /**
   * Returns all alarms that match the following privilege:
   * - resource: alarm, action: read
   *
   * @example id "d9e42451-3794-089f-de81-4ee0e6137bee"
   * @example fields "id,time"
   * @example filter "time:>1747053793"
   * @example limit 42
   */
  @Example(genericAlarmsExample)
  @Extension('x-mcp-exposure', 'allow')
  @Get('{id}/alarms')
  @Security('*', ['acl'])
  @Tags('alarms')
  @Response(notFoundResp.status, notFoundResp.description)
  getPifAlarms(
    @Request() req: ExRequest,
    @Path() id: string,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() markdown?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<Unbrand<XoAlarm>>> {
    const pif = this.getObject(id as XoPif['id'])
    const alarms = this.#alarmService.getAlarms({
      filter: `${escapeUnsafeComplexMatcher(filter) ?? ''} object:uuid:${pif.uuid}`,
    })

    return this.sendObjects(Object.values(alarms), req, {
      path: 'alarms',
      limit,
      privilege: { action: 'read', resource: 'alarm' },
    })
  }

  /**
   * Returns all messages that match the following privilege:
   * - resource: message, action: read
   *
   * @example id "d9e42451-3794-089f-de81-4ee0e6137bee"
   * @example fields "name,id,$object"
   * @example filter "name:VM_STARTED"
   * @example limit 42
   */
  @Example(messageIds)
  @Example(partialMessages)
  @Extension('x-mcp-exposure', 'allow')
  @Get('{id}/messages')
  @Security('*', ['acl'])
  @Tags('messages')
  @Response(notFoundResp.status, notFoundResp.description)
  getPifMessages(
    @Request() req: ExRequest,
    @Path() id: string,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() markdown?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<Unbrand<XoMessage>>> {
    const messages = this.getMessagesForObject(id as XoPif['id'], { filter })

    return this.sendObjects(Object.values(messages), req, {
      path: 'messages',
      limit,
      privilege: { action: 'read', resource: 'message' },
    })
  }

  /**
   * Returns all tasks that match the following privilege:
   * - resource: task, action: read
   *
   * @example id "d9e42451-3794-089f-de81-4ee0e6137bee"
   * @example fields "id,status,properties"
   * @example filter "status:failure"
   * @example limit 42
   */
  @Example(taskIds)
  @Example(partialTasks)
  @Extension('x-mcp-exposure', 'allow')
  @Get('{id}/tasks')
  @Security('*', ['acl'])
  @Tags('tasks')
  @Response(notFoundResp.status, notFoundResp.description)
  async getPifTasks(
    @Request() req: ExRequest,
    @Path() id: string,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() markdown?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<Unbrand<XoTask>>> {
    const tasks = await this.getTasksForObject(id as XoPif['id'], { filter })

    return this.sendObjects(Object.values(tasks), req, {
      path: 'tasks',
      limit,
      privilege: { action: 'read', resource: 'task' },
    })
  }

  /**
   * Changes the VLAN tag of a VLAN PIF. Every PIF of its network, on every host, is recreated with the new tag.
   *
   * Required privilege:
   * - resource: pif, action: update:vlan
   *
   * @example id "d9e42451-3794-089f-de81-4ee0e6137bee"
   * @example body { "vlan": 42 }
   */
  @Extension('x-mcp-exposure', 'confirm')
  @Patch('{id}')
  @Middlewares([json(), acl({ resource: 'pif', actions: actionsFromBody(['update:vlan']), objectId: 'params.id' })])
  @SuccessResponse(noContentResp.status, noContentResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(invalidParametersResp.status, invalidParametersResp.description)
  async updatePif(@Path() id: string, @Body() body: UpdatePifBody): Promise<void> {
    const pifId = id as XoPif['id']
    if (body.vlan !== undefined) {
      const pif = this.getObject(pifId)
      if (pif.vlan === -1) {
        throw invalidParameters('only a VLAN PIF can change its VLAN tag')
      }
      await this.getXapiObject(pifId).$xapi.editPif(pifId, { vlan: body.vlan })
    }
  }

  /**
   * Plugs the PIF.
   *
   * Required privilege:
   * - resource: pif, action: connect
   *
   * @example id "d9e42451-3794-089f-de81-4ee0e6137bee"
   */
  @Example(taskLocation)
  @Extension('x-mcp-exposure', 'confirm')
  @Post('{id}/actions/connect')
  @Middlewares(acl({ resource: 'pif', action: 'connect', objectId: 'params.id' }))
  @SuccessResponse(asynchronousActionResp.status, asynchronousActionResp.description)
  @Response(noContentResp.status, noContentResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  connectPif(@Path() id: string, @Query() sync?: boolean): CreateActionReturnType<void> {
    const pifId = id as XoPif['id']
    const action = async () => {
      const pif = this.getXapiObject(pifId)
      await pif.$xapi.callAsync('PIF.plug', pif.$ref)
    }

    return this.createAction<void>(action, {
      sync,
      statusCode: noContentResp.status,
      taskProperties: { name: 'connect PIF', objectId: pifId },
    })
  }

  /**
   * Unplugs the PIF. The management PIF cannot be unplugged.
   *
   * Required privilege:
   * - resource: pif, action: disconnect
   *
   * @example id "d9e42451-3794-089f-de81-4ee0e6137bee"
   */
  @Example(taskLocation)
  @Extension('x-mcp-exposure', 'confirm')
  @Post('{id}/actions/disconnect')
  @Middlewares(acl({ resource: 'pif', action: 'disconnect', objectId: 'params.id' }))
  @SuccessResponse(asynchronousActionResp.status, asynchronousActionResp.description)
  @Response(noContentResp.status, noContentResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(invalidParametersResp.status, invalidParametersResp.description)
  disconnectPif(@Path() id: string, @Query() sync?: boolean): CreateActionReturnType<void> {
    const pifId = id as XoPif['id']
    const action = async () => {
      if (this.getObject(pifId).management) {
        throw invalidParameters('the management PIF cannot be disconnected')
      }
      const pif = this.getXapiObject(pifId)
      await pif.$xapi.callAsync('PIF.unplug', pif.$ref)
    }

    return this.createAction<void>(action, {
      sync,
      statusCode: noContentResp.status,
      taskProperties: { name: 'disconnect PIF', objectId: pifId },
    })
  }

  /**
   * Reconfigures the IP of the PIF. On the management PIF, the management interface is reconfigured too.
   *
   * Required privilege:
   * - resource: pif, action: reconfigure-ip
   *
   * @example id "d9e42451-3794-089f-de81-4ee0e6137bee"
   * @example body { "mode": "Static", "ip": "192.168.1.10", "netmask": "255.255.255.0", "gateway": "192.168.1.1", "dns": "192.168.1.1" }
   */
  @Example(taskLocation)
  @Extension('x-mcp-exposure', 'confirm')
  @Post('{id}/actions/reconfigure_ip')
  @Middlewares([json(), acl({ resource: 'pif', action: 'reconfigure-ip', objectId: 'params.id' })])
  @SuccessResponse(asynchronousActionResp.status, asynchronousActionResp.description)
  @Response(noContentResp.status, noContentResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(invalidParametersResp.status, invalidParametersResp.description)
  reconfigurePifIp(
    @Path() id: string,
    @Body() body: ReconfigurePifIpBody,
    @Query() sync?: boolean
  ): CreateActionReturnType<void> {
    const pifId = id as XoPif['id']
    const action = async () => {
      const { mode, ip = '', netmask = '', gateway = '', dns = '' } = body
      if (mode === 'Static' && (ip === '' || netmask === '')) {
        throw invalidParameters('a static configuration needs an IP and a netmask')
      }

      const xoPif = this.getObject(pifId)
      const pif = this.getXapiObject(pifId)
      const xapi = pif.$xapi

      await xapi.call('PIF.reconfigure_ip', pif.$ref, mode, ip, netmask, gateway, dns)
      if (xoPif.management) {
        await xapi.call('host.management_reconfigure', pif.$ref)
      }
    }

    return this.createAction<void>(action, {
      sync,
      statusCode: noContentResp.status,
      taskProperties: { name: 'reconfigure PIF IP', objectId: pifId, params: body },
    })
  }
}
