import {
  Body,
  Controller,
  Delete,
  Extension,
  Get,
  Middlewares,
  Patch,
  Path,
  Post,
  Response,
  Route,
  Security,
  SuccessResponse,
  Tags,
} from 'tsoa'
import { inject } from 'inversify'
import { provide } from 'inversify-binding-decorators'
import { json } from 'express'
import { invalidParameters, unauthorized } from 'fragata-common/api-errors.js'
import type { XoResourceSet } from '@fragata/types'

import {
  badRequestResp,
  createdResp,
  forbiddenOperationResp,
  invalidParameters as invalidParametersResp,
  noContentResp,
  notFoundResp,
  unauthorizedResp,
} from '../open-api/common/response.common.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'
import { BASE_URL } from '../helpers/utils.helper.mjs'
import type { CreateResourceSetBody, ResourceSet, ResourceSetQuotas, UpdateResourceSetBody } from './resource-set.type.mjs'

const toResourceSet = (set: XoResourceSet): ResourceSet => ({ ...set, href: `${BASE_URL}/resource-sets/${set.id}` })

function checkLimits(limits: ResourceSetQuotas | undefined) {
  for (const [key, value] of Object.entries(limits ?? {})) {
    if (!(key === 'cpus' || key === 'memory' || key === 'disk' || key.startsWith('ipPool:'))) {
      throw invalidParameters(`unknown limit ${key}: use cpus, memory, disk or ipPool:<id>`)
    }
    if (!Number.isFinite(value) || value < 0) {
      throw invalidParameters(`the limit ${key} must be a positive number`)
    }
  }
}

/**
 * Self-service: resource sets let users and groups that are not administrators create VMs
 * from given templates, on given SRs and networks, within quotas.
 *
 * Reading is open to the subjects of a set; every change needs an administrator.
 */
@Route('resource-sets')
@Security('*')
@Response(badRequestResp.status, badRequestResp.description)
@Response(unauthorizedResp.status, unauthorizedResp.description)
@Tags('resource-sets')
@provide(ResourceSetController)
export class ResourceSetController extends Controller {
  #restApi: RestApi

  constructor(@inject(RestApi) restApi: RestApi) {
    super()
    this.#restApi = restApi
  }

  /**
   * Administrators get every set, other users the sets they are a subject of.
   */
  @Extension('x-mcp-exposure', 'allow')
  @Get('')
  @Security('*', ['acl'])
  async getResourceSets(): Promise<ResourceSet[]> {
    const user = this.#restApi.getCurrentUser()
    const sets = await this.#restApi.xoApp.getAllResourceSets(user.id)
    return sets.map(toResourceSet)
  }

  /**
   * @example id "Hk3cJu0tx"
   */
  @Extension('x-mcp-exposure', 'allow')
  @Get('{id}')
  @Security('*', ['acl'])
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  async getResourceSet(@Path() id: string): Promise<ResourceSet> {
    const set = await this.#restApi.xoApp.getResourceSet(id)
    const user = this.#restApi.getCurrentUser()
    if (user.permission !== 'admin') {
      const subjects = new Set<string>([user.id, ...user.groups])
      if (!set.subjects.some(subject => subjects.has(subject))) {
        throw unauthorized()
      }
    }
    return toResourceSet(set)
  }

  /**
   * @example body { "name": "dev team", "subjects": ["1ca3e3e6-0f5c-4d0e-9b32-41b2b3e4a5c7"], "objects": [], "limits": { "cpus": 16, "memory": 34359738368 } }
   */
  @Extension('x-mcp-exposure', 'confirm')
  @Post('')
  @Middlewares(json())
  @SuccessResponse(createdResp.status, createdResp.description)
  @Response(invalidParametersResp.status, invalidParametersResp.description)
  async createResourceSet(@Body() body: CreateResourceSetBody): Promise<{ id: string }> {
    checkLimits(body.limits)
    const set = await this.#restApi.xoApp.createResourceSet(
      body.name,
      body.subjects,
      body.objects,
      body.limits,
      body.shareByDefault,
      body.tags
    )
    if (body.ipPools !== undefined && body.ipPools.length > 0) {
      await this.#restApi.xoApp.updateResourceSet(set.id, { ipPools: body.ipPools })
    }
    this.setStatus(createdResp.status)
    this.setHeader('Location', `${BASE_URL}/resource-sets/${set.id}`)
    return { id: set.id }
  }

  /**
   * Lists given in the body replace the current ones. `limits` replaces every quota: a quota left out is removed,
   * its usage is kept.
   *
   * @example id "Hk3cJu0tx"
   * @example body { "limits": { "cpus": 32 } }
   */
  @Extension('x-mcp-exposure', 'confirm')
  @Patch('{id}')
  @Middlewares(json())
  @SuccessResponse(noContentResp.status, noContentResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(invalidParametersResp.status, invalidParametersResp.description)
  async updateResourceSet(@Path() id: string, @Body() body: UpdateResourceSetBody): Promise<void> {
    checkLimits(body.limits)
    if (body.name === '') {
      throw invalidParameters('the name cannot be empty')
    }
    await this.#restApi.xoApp.updateResourceSet(id, body)
  }

  /**
   * VMs of the set leave it; they are not deleted.
   *
   * @example id "Hk3cJu0tx"
   */
  @Extension('x-mcp-exposure', 'confirm')
  @Delete('{id}')
  @SuccessResponse(noContentResp.status, noContentResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  async deleteResourceSet(@Path() id: string): Promise<void> {
    await this.#restApi.xoApp.deleteResourceSet(id)
  }

  /**
   * Recomputes the usage of every quota from the VMs of each set.
   */
  @Extension('x-mcp-exposure', 'confirm')
  @Post('actions/recompute_limits')
  @SuccessResponse(noContentResp.status, noContentResp.description)
  async recomputeResourceSetsLimits(): Promise<void> {
    await this.#restApi.xoApp.recomputeResourceSetsLimits()
  }
}
