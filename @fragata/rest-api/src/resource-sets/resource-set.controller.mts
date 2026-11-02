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
import type { XoAclRole, XoNetwork, XoResourceSet, XoSr, XoVm, XoVmTemplate } from '@fragata/types'

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
import { VmService } from '../vms/vm.service.mjs'
import type {
  CreateResourceSetBody,
  CreateVmInResourceSetBody,
  ResourceSet,
  ResourceSetQuotas,
  UpdateResourceSetBody,
} from './resource-set.type.mjs'

const SELF_SERVICE_ROLE_PREFIX = 'Self-service: '

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
  #vmService: VmService

  constructor(@inject(RestApi) restApi: RestApi, @inject(VmService) vmService: VmService) {
    super()
    this.#restApi = restApi
    this.#vmService = vmService
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

  /**
   * Creates a VM in the set: open to its subjects, from a template of the set, with disks on SRs of the set and
   * VIFs on networks of the set. The usage of the VM is counted in the quotas of the set: the VM is destroyed when
   * it does not fit.
   *
   * The subjects see and manage the VMs of the set through the role made by `grant_access`.
   *
   * @example id "Hk3cJu0tx"
   * @example body { "name_label": "web-01", "template": "552bce37-51b2-445d-84f2-5f33fa112d7e", "vdis": [{ "name_label": "web-01 disk", "size": 10737418240, "sr": "c3b86663-a3ca-6c17-a7df-b79902353b60" }], "vifs": [{ "network": "6b6ca0f5-6611-0636-4b0a-1fb1c815e969" }] }
   */
  @Extension('x-mcp-exposure', 'confirm')
  @Post('{id}/actions/create_vm')
  @Security('*', ['acl'])
  @Middlewares(json())
  @SuccessResponse(createdResp.status, createdResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(invalidParametersResp.status, invalidParametersResp.description)
  async createVmInResourceSet(@Path() id: string, @Body() body: CreateVmInResourceSetBody): Promise<{ id: string }> {
    const restApi = this.#restApi
    const xoApp = restApi.xoApp
    const user = restApi.getCurrentUser()
    const set = await xoApp.getResourceSet(id)

    const template = Object.values(
      restApi.getObjectsByType<XoVmTemplate>('VM-template', { filter: t => t.uuid === body.template })
    )[0]
    if (template === undefined) {
      throw invalidParameters(`no template ${body.template}`)
    }
    const srs = (body.vdis ?? []).map(vdi => restApi.getObject<XoSr>(vdi.sr as XoSr['id'], 'SR'))
    const networks = (body.vifs ?? []).map(vif =>
      restApi.getObject<XoNetwork>(vif.network as XoNetwork['id'], 'network')
    )
    if ([...srs, ...networks].some(object => object.$pool !== template.$pool)) {
      throw invalidParameters('the SRs and networks must belong to the pool of the template')
    }

    // an administrator can create a VM in the set with objects outside of it
    await xoApp.checkResourceSetConstraints(
      id,
      user.id,
      user.permission === 'admin' ? undefined : [template.id, ...srs.map(sr => sr.id), ...networks.map(n => n.id)]
    )

    const { share = set.shareByDefault, template: _, vifs, ...rest } = body
    const vmId = (await this.#vmService.create({
      ...rest,
      pool: template.$pool,
      template: template.uuid,
      tags: set.tags,
      // the VIFs of the template are replaced by the ones of the body
      vifs: [
        ...template.VIFs.map((_vifId, index) => ({ device: String(index), destroy: true as const })),
        ...(vifs ?? []),
      ],
    } as Parameters<VmService['create']>[0])) as XoVm['id']

    try {
      // counts the usage of the VM in the quotas, refused when they are exceeded
      await xoApp.setVmResourceSet(vmId, id, user.permission === 'admin')
    } catch (error) {
      await xoApp.getXapi(vmId).VM_destroy(restApi.getObject<XoVm>(vmId, 'VM')._xapiRef as never)
      throw error
    }
    if (share) {
      await xoApp.shareVmResourceSet(vmId)
    }

    this.setStatus(createdResp.status)
    this.setHeader('Location', `${BASE_URL}/vms/${vmId}`)
    return { id: vmId }
  }

  /**
   * Gives the subjects of the set access to it through an ACL role, `Self-service: <name of the set>`, made or
   * updated by this action: every action on the VMs of the set, and reading its templates, SRs, networks and their
   * pools. Run it again after changing the subjects or the objects of the set.
   *
   * @example id "Hk3cJu0tx"
   */
  @Extension('x-mcp-exposure', 'confirm')
  @Post('{id}/actions/grant_access')
  @Response(notFoundResp.status, notFoundResp.description)
  async grantResourceSetAccess(@Path() id: string): Promise<{ roleId: string }> {
    const restApi = this.#restApi
    const xoApp = restApi.xoApp
    const set = await xoApp.getResourceSet(id)
    const name = SELF_SERVICE_ROLE_PREFIX + set.name

    // replace the role of a previous run: its privileges follow the objects of the set at that time
    const previous = await xoApp.getAclV2Roles()
    for (const role of previous.filter(r => r.name === name)) {
      await xoApp.deleteAclV2Role(role.id, { force: true })
    }

    type SetObject = { id: string; type: string; $pool: string }
    // objects of a disconnected pool are left out
    const objects = set.objects.flatMap(objectId => {
      try {
        return [restApi.getObject(objectId as XoSr['id']) as unknown as SetObject]
      } catch {
        return []
      }
    })
    const idsOf = (type: string) => objects.filter(object => object.type === type).map(object => object.id)
    const selector = (ids: string[]) => (ids.length === 0 ? 'id:__none__' : `id:(${ids.join(' ')})`)
    const pools = [...new Set(objects.map(object => object.$pool))]

    const role = await xoApp.createAclV2Role({
      name,
      description: `Access to the resource set ${set.name}`,
      privileges: [
        { resource: 'vm', action: '*', effect: 'allow', selector: `resourceSet:${id}` },
        { resource: 'vm-template', action: 'read', effect: 'allow', selector: selector(idsOf('VM-template')) },
        { resource: 'sr', action: 'read', effect: 'allow', selector: selector(idsOf('SR')) },
        { resource: 'network', action: 'read', effect: 'allow', selector: selector(idsOf('network')) },
        { resource: 'pool', action: 'read', effect: 'allow', selector: selector(pools) },
      ] as Parameters<typeof xoApp.createAclV2Role>[0]['privileges'],
    })

    const groupIds = new Set((await xoApp.getAllGroups()).map(group => group.id as string))
    for (const subject of set.subjects) {
      if (groupIds.has(subject)) {
        await xoApp.addAclV2GroupRole(subject as never, role.id as XoAclRole['id'])
      } else {
        await xoApp.addAclV2UserRole(subject as never, role.id as XoAclRole['id'])
      }
    }
    return { roleId: role.id }
  }
}
