import { Middlewares, Path, Post, Response, Route, Security, SuccessResponse, Tags } from 'tsoa'
import { inject } from 'inversify'
import { provide } from 'inversify-binding-decorators'
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

const CONTAINER_ACTIONS = ['start', 'stop', 'restart', 'pause', 'unpause'] as const
type ContainerAction = (typeof CONTAINER_ACTIONS)[number]

/** methods of the pool connection driving the `xscontainer` plugin of the hosts */
type DockerXapi = {
  registerDockerContainer(vmId: string): Promise<void>
  deregisterDockerContainer(vmId: string): Promise<void>
} & Record<`${ContainerAction}DockerContainer`, (vmId: string, containerId: string) => Promise<void>>

const MANAGE_DOCKER = acl({ resource: 'vm', action: 'manage-docker', objectId: 'params.id' })

/**
 * Docker containers of a VM, through the `xscontainer` supplemental pack of the hosts. The containers of a
 * registered VM are listed in its `docker` property.
 */
@Route('vms')
@Security('*')
@Response(badRequestResp.status, badRequestResp.description)
@Response(unauthorizedResp.status, unauthorizedResp.description)
@Tags('vms')
@provide(VmDockerController)
export class VmDockerController extends XapiXoController<XoVm> {
  constructor(@inject(RestApi) restApi: RestApi) {
    super('VM', restApi)
  }

  #xapi(vmId: XoVm['id']) {
    return this.getXapi(vmId) as unknown as DockerXapi
  }

  /**
   * Required privilege:
   * - resource: vm, action: manage-docker
   *
   * @example id "f07ab729-c0e8-721c-45ec-f11276377030"
   */
  @Post('{id}/actions/docker_register')
  @Middlewares(MANAGE_DOCKER)
  @SuccessResponse(noContentResp.status, noContentResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  async registerVmDocker(@Path() id: string): Promise<void> {
    const vmId = this.getObject(id as XoVm['id']).id
    await this.#xapi(vmId).registerDockerContainer(vmId)
  }

  /**
   * Required privilege:
   * - resource: vm, action: manage-docker
   *
   * @example id "f07ab729-c0e8-721c-45ec-f11276377030"
   */
  @Post('{id}/actions/docker_deregister')
  @Middlewares(MANAGE_DOCKER)
  @SuccessResponse(noContentResp.status, noContentResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  async deregisterVmDocker(@Path() id: string): Promise<void> {
    const vmId = this.getObject(id as XoVm['id']).id
    await this.#xapi(vmId).deregisterDockerContainer(vmId)
  }

  /**
   * `action` is one of `start`, `stop`, `restart`, `pause` and `unpause`.
   *
   * Required privilege:
   * - resource: vm, action: manage-docker
   *
   * @example id "f07ab729-c0e8-721c-45ec-f11276377030"
   * @example container "5c4d1f0b9a3e"
   * @example action "restart"
   */
  @Post('{id}/docker_containers/{container}/actions/{action}')
  @Middlewares(MANAGE_DOCKER)
  @SuccessResponse(noContentResp.status, noContentResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(invalidParametersResp.status, invalidParametersResp.description)
  async runVmDockerContainerAction(
    @Path() id: string,
    @Path() container: string,
    @Path() action: string
  ): Promise<void> {
    if (!(CONTAINER_ACTIONS as readonly string[]).includes(action)) {
      throw invalidParameters(`unknown action ${action}: use ${CONTAINER_ACTIONS.join(', ')}`)
    }
    const vmId = this.getObject(id as XoVm['id']).id
    await this.#xapi(vmId)[`${action as ContainerAction}DockerContainer`](vmId, container)
  }
}
