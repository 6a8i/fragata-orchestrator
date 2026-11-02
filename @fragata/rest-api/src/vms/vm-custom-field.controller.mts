import { Body, Delete, Get, Middlewares, Path, Put, Response, Route, Security, SuccessResponse, Tags } from 'tsoa'
import { inject } from 'inversify'
import { provide } from 'inversify-binding-decorators'
import { json } from 'express'
import { invalidParameters } from 'fragata-common/api-errors.js'
import type { XoVm } from '@fragata/types'

import { acl } from '../middlewares/acl.middleware.mjs'
import {
  badRequestResp,
  forbiddenOperationResp,
  invalidParameters as invalidParametersResp,
  noContentResp,
  notFoundResp,
  unauthorizedResp,
} from '../open-api/common/response.common.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'
import { XapiXoController } from '../abstract-classes/xapi-xo-controller.mjs'
import type { SetVmCustomFieldBody } from './vm-custom-field.type.mjs'

// same key as the other management tools, so the fields are shared with them
const KEY_PREFIX = 'XenCenter.CustomFields.'

const MANAGE_CUSTOM_FIELDS = acl({ resource: 'vm', action: 'manage-custom-fields', objectId: 'params.id' })

function checkName(name: string) {
  if (name.trim() === '') {
    throw invalidParameters('the name of a custom field cannot be empty')
  }
}

/**
 * Custom fields: free key/value pairs attached to a VM.
 */
@Route('vms')
@Security('*')
@Response(badRequestResp.status, badRequestResp.description)
@Response(unauthorizedResp.status, unauthorizedResp.description)
@Tags('vms')
@provide(VmCustomFieldController)
export class VmCustomFieldController extends XapiXoController<XoVm> {
  constructor(@inject(RestApi) restApi: RestApi) {
    super('VM', restApi)
  }

  /**
   * Required privilege:
   * - resource: vm, action: read
   *
   * @example id "f07ab729-c0e8-721c-45ec-f11276377030"
   */
  @Get('{id}/custom_fields')
  @Middlewares(acl({ resource: 'vm', action: 'read', objectId: 'params.id' }))
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  getVmCustomFields(@Path() id: string): Record<string, string> {
    const other = (this.getObject(id as XoVm['id']) as XoVm & { other?: Record<string, string> }).other ?? {}
    const fields: Record<string, string> = {}
    for (const [key, value] of Object.entries(other)) {
      if (key.startsWith(KEY_PREFIX)) {
        fields[key.slice(KEY_PREFIX.length)] = value
      }
    }
    return fields
  }

  /**
   * Creates or replaces a custom field.
   *
   * Required privilege:
   * - resource: vm, action: manage-custom-fields
   *
   * @example id "f07ab729-c0e8-721c-45ec-f11276377030"
   * @example name "owner"
   * @example body { "value": "team infra" }
   */
  @Put('{id}/custom_fields/{name}')
  @Middlewares([json(), MANAGE_CUSTOM_FIELDS])
  @SuccessResponse(noContentResp.status, noContentResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(invalidParametersResp.status, invalidParametersResp.description)
  async setVmCustomField(@Path() id: string, @Path() name: string, @Body() body: SetVmCustomFieldBody): Promise<void> {
    checkName(name)
    const vm = this.getXapiObject(id as XoVm['id'])
    // add_to_other_config fails on an existing key
    await vm.$xapi.call('VM.remove_from_other_config', vm.$ref, KEY_PREFIX + name)
    await vm.$xapi.call('VM.add_to_other_config', vm.$ref, KEY_PREFIX + name, body.value)
  }

  /**
   * Required privilege:
   * - resource: vm, action: manage-custom-fields
   *
   * @example id "f07ab729-c0e8-721c-45ec-f11276377030"
   * @example name "owner"
   */
  @Delete('{id}/custom_fields/{name}')
  @Middlewares(MANAGE_CUSTOM_FIELDS)
  @SuccessResponse(noContentResp.status, noContentResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  async deleteVmCustomField(@Path() id: string, @Path() name: string): Promise<void> {
    checkName(name)
    const vm = this.getXapiObject(id as XoVm['id'])
    await vm.$xapi.call('VM.remove_from_other_config', vm.$ref, KEY_PREFIX + name)
  }
}
