import {
  Body,
  Delete,
  Example,
  Extension,
  Get,
  Middlewares,
  Patch,
  Path,
  Put,
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
import { json, Request as ExRequest } from 'express'
import { invalidParameters } from 'fragata-common/api-errors.js'
import { SUPPORTED_ACTIONS_BY_RESOURCE, type SupportedActions } from '@fragata/acl'
import type { XoAlarm, XoMessage, XoNetwork, XoTask } from '@fragata/types'

import { AlarmService } from '../alarms/alarm.service.mjs'
import { escapeUnsafeComplexMatcher } from '../helpers/utils.helper.mjs'
import { genericAlarmsExample } from '../open-api/oa-examples/alarm.oa-example.mjs'
import { network, networkIds, partialNetworks } from '../open-api/oa-examples/network.oa-example.mjs'
import {
  badRequestResp,
  forbiddenOperationResp,
  invalidParameters as invalidParametersResp,
  noContentResp,
  notFoundResp,
  unauthorizedResp,
  type Unbrand,
} from '../open-api/common/response.common.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'
import type { SendObjects } from '../helpers/helper.type.mjs'
import { XapiXoController } from '../abstract-classes/xapi-xo-controller.mjs'
import { messageIds, partialMessages } from '../open-api/oa-examples/message.oa-example.mjs'
import { partialTasks, taskIds } from '../open-api/oa-examples/task.oa-example.mjs'
import { acl, actionsFromBody } from '../middlewares/acl.middleware.mjs'
import type { UpdateNetworkBody } from './network.type.mjs'

const UPDATE_NETWORK_ACTIONS = Object.keys(SUPPORTED_ACTIONS_BY_RESOURCE.network.update)
  .filter(action => action !== 'tags' && action !== 'other_config')
  .map(k => `update:${k}` as SupportedActions<'network'>)

@Route('networks')
@Security('*')
@Response(badRequestResp.status, badRequestResp.description)
@Response(unauthorizedResp.status, unauthorizedResp.description)
@Tags('networks')
@provide(NetworkController)
export class NetworkController extends XapiXoController<XoNetwork> {
  #alarmService: AlarmService
  constructor(@inject(RestApi) restApi: RestApi, @inject(AlarmService) alarmService: AlarmService) {
    super('network', restApi)
    this.#alarmService = alarmService
  }

  /**
   * Returns all networks that match the following privilege:
   * - resource: network, action: read
   *
   * @example fields "nbd,name_label,id"
   * @example filter "nbd?"
   * @example limit 42
   */
  @Example(networkIds)
  @Example(partialNetworks)
  @Extension('x-mcp-exposure', 'allow')
  @Get('')
  @Security('*', ['acl'])
  getNetworks(
    @Request() req: ExRequest,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() markdown?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<Unbrand<XoNetwork>>> {
    return this.sendObjects(Object.values(this.getObjects({ filter })), req, {
      limit,
      privilege: { action: 'read', resource: 'network' },
    })
  }

  /**
   * Required privilege:
   * - resource: network, action: read
   *
   * @example id "9fe12ca3-d75d-cfb0-492e-cfd2bc6c568f"
   */
  @Example(network)
  @Extension('x-mcp-exposure', 'allow')
  @Get('{id}')
  @Middlewares(acl({ resource: 'network', action: 'read', objectId: 'params.id' }))
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  getNetwork(@Path() id: string): Unbrand<XoNetwork> {
    return this.getObject(id as XoNetwork['id'])
  }

  /**
   * Required privilege:
   * - resource: network, action: delete
   *
   * @example id "9fe12ca3-d75d-cfb0-492e-cfd2bc6c568f"
   */
  @Extension('x-mcp-exposure', 'confirm')
  @Delete('{id}')
  @Middlewares(acl({ resource: 'network', action: 'delete', objectId: 'params.id' }))
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @SuccessResponse(noContentResp.status, noContentResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  async deleteNetwork(@Path() id: string): Promise<void> {
    const networkId = id as XoNetwork['id']
    await this.getXapiObject(networkId).$xapi.deleteNetwork(networkId)
  }

  /**
   * Returns all alarms that match the following privilege:
   * - resource: alarm, action: read
   *
   * @example id "9fe12ca3-d75d-cfb0-492e-cfd2bc6c568f"
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
  getNetworkAlarms(
    @Request() req: ExRequest,
    @Path() id: string,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() markdown?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<Unbrand<XoAlarm>>> {
    const network = this.getObject(id as XoNetwork['id'])
    const alarms = this.#alarmService.getAlarms({
      filter: `${escapeUnsafeComplexMatcher(filter) ?? ''} object:uuid:${network.uuid}`,
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
   * @example id "9fe12ca3-d75d-cfb0-492e-cfd2bc6c568f"
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
  getNetworkMessages(
    @Request() req: ExRequest,
    @Path() id: string,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() markdown?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<Unbrand<XoMessage>>> {
    const messages = this.getMessagesForObject(id as XoNetwork['id'], { filter })

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
   * @example id "9fe12ca3-d75d-cfb0-492e-cfd2bc6c568f"
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
  async getNetworkTasks(
    @Request() req: ExRequest,
    @Path() id: string,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() markdown?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<Unbrand<XoTask>>> {
    const tasks = await this.getTasksForObject(id as XoNetwork['id'], { filter })

    return this.sendObjects(Object.values(tasks), req, {
      path: 'tasks',
      limit,
      privilege: { action: 'read', resource: 'task' },
    })
  }

  /**
   * Required privilege:
   * - resource: network, action: update:tags
   *
   * @example id "9fe12ca3-d75d-cfb0-492e-cfd2bc6c568f"
   * @example tag "from-rest-api"
   */
  @Extension('x-mcp-exposure', 'confirm')
  @Put('{id}/tags/{tag}')
  @Middlewares(acl({ resource: 'network', action: 'update:tags', objectId: 'params.id' }))
  @SuccessResponse(noContentResp.status, noContentResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  async putNetworkTag(@Path() id: string, @Path() tag: string): Promise<void> {
    const network = this.getXapiObject(id as XoNetwork['id'])
    await network.$call('add_tags', tag)
  }

  /**
   * Required privilege:
   * - resource: network, action: update:tags
   *
   * @example id "9fe12ca3-d75d-cfb0-492e-cfd2bc6c568f"
   * @example tag "from-rest-api"
   */
  @Extension('x-mcp-exposure', 'confirm')
  @Delete('{id}/tags/{tag}')
  @Middlewares(acl({ resource: 'network', action: 'update:tags', objectId: 'params.id' }))
  @SuccessResponse(noContentResp.status, noContentResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  async deleteNetworkTag(@Path() id: string, @Path() tag: string): Promise<void> {
    const network = this.getXapiObject(id as XoNetwork['id'])
    await network.$call('remove_tags', tag)
  }

  /**
   * Partial update of a network. Only the fields present in the body are modified.
   *
   * Required privilege per field provided in the body:
   * - resource: network, action: update:&lt;field&gt; (e.g. update:nameLabel, update:mtu, ...)
   *
   * `nbd` and `insecureNbd` are mutually exclusive: enabling one disables the other.
   *
   * @example id "9fe12ca3-d75d-cfb0-492e-cfd2bc6c568f"
   * @example body { "nameLabel": "backup", "nbd": true }
   */
  @Patch('{id}')
  @Middlewares([
    json(),
    acl({ resource: 'network', actions: actionsFromBody(UPDATE_NETWORK_ACTIONS), objectId: 'params.id' }),
  ])
  @SuccessResponse(noContentResp.status, noContentResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(invalidParametersResp.status, invalidParametersResp.description)
  async updateNetwork(@Path() id: string, @Body() body: UpdateNetworkBody): Promise<void> {
    const { nameLabel, nameDescription, mtu, automatic, defaultIsLocked, nbd, insecureNbd } = body
    if (nbd === true && insecureNbd === true) {
      throw invalidParameters('nbd and insecureNbd are mutually exclusive')
    }

    const network = this.getXapiObject(id as XoNetwork['id'])
    const xapi = network.$xapi
    const ref = network.$ref

    if (nameLabel !== undefined) {
      await xapi.call('network.set_name_label', ref, nameLabel)
    }
    if (nameDescription !== undefined) {
      await xapi.call('network.set_name_description', ref, nameDescription)
    }
    if (mtu !== undefined) {
      await xapi.call('network.set_MTU', ref, mtu)
    }
    if (automatic !== undefined) {
      await xapi.call('network.remove_from_other_config', ref, 'automatic')
      if (automatic) {
        await xapi.call('network.add_to_other_config', ref, 'automatic', 'true')
      }
    }
    if (defaultIsLocked !== undefined) {
      await xapi.call('network.set_default_locking_mode', ref, defaultIsLocked ? 'disabled' : 'unlocked')
    }

    // nbd and insecure_nbd are incompatible purposes: the other one is removed before adding one
    const purposesToRemove = new Set<string>()
    let purposeToAdd: string | undefined
    if (nbd === true) {
      purposesToRemove.add('insecure_nbd')
      purposeToAdd = 'nbd'
    } else if (nbd === false) {
      purposesToRemove.add('nbd')
    }
    if (insecureNbd === true) {
      purposesToRemove.add('nbd')
      purposeToAdd = 'insecure_nbd'
    } else if (insecureNbd === false) {
      purposesToRemove.add('insecure_nbd')
    }
    const currentPurposes: string[] = network.purpose ?? []
    for (const purpose of purposesToRemove) {
      if (currentPurposes.includes(purpose)) {
        await xapi.call('network.remove_purpose', ref, purpose)
      }
    }
    if (purposeToAdd !== undefined) {
      await xapi.call('network.add_purpose', ref, purposeToAdd)
    }
  }
}
