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
  Query,
  Response,
  Route,
  Security,
  SuccessResponse,
  Tags,
} from 'tsoa'
import { inject } from 'inversify'
import { provide } from 'inversify-binding-decorators'
import { json } from 'express'
import { invalidParameters } from 'fragata-common/api-errors.js'
import type { XoCloudConfig } from '@fragata/types'

import {
  badRequestResp,
  createdResp,
  invalidParameters as invalidParametersResp,
  noContentResp,
  notFoundResp,
  unauthorizedResp,
} from '../open-api/common/response.common.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'
import { BASE_URL } from '../helpers/utils.helper.mjs'
import type { CloudConfig, CreateCloudConfigBody, UpdateCloudConfigBody } from './cloud-config.type.mjs'

const toCloudConfig = ({ id, name, template, type }: XoCloudConfig): CloudConfig => ({
  id,
  name,
  template,
  type: type ?? 'user',
  href: `${BASE_URL}/cloud-configs/${id}`,
})

/**
 * cloud-init templates offered when creating a VM: user data and network configurations. Administrators only.
 */
@Route('cloud-configs')
@Security('*')
@Response(badRequestResp.status, badRequestResp.description)
@Response(unauthorizedResp.status, unauthorizedResp.description)
@Tags('cloud-configs')
@provide(CloudConfigController)
export class CloudConfigController extends Controller {
  #restApi: RestApi

  constructor(@inject(RestApi) restApi: RestApi) {
    super()
    this.#restApi = restApi
  }

  /**
   * @example type "network"
   */
  @Extension('x-mcp-exposure', 'allow')
  @Get('')
  async getCloudConfigs(@Query() type?: 'user' | 'network'): Promise<CloudConfig[]> {
    const xoApp = this.#restApi.xoApp
    const [user, network] = await Promise.all([
      type === 'network' ? [] : xoApp.getAllCloudConfigs(),
      type === 'user' ? [] : xoApp.getAllNetworkConfigs(),
    ])
    return [...user, ...network].map(toCloudConfig)
  }

  /**
   * @example id "Bk-tkgSlz"
   */
  @Extension('x-mcp-exposure', 'allow')
  @Get('{id}')
  @Response(notFoundResp.status, notFoundResp.description)
  async getCloudConfig(@Path() id: string): Promise<CloudConfig> {
    return toCloudConfig(await this.#restApi.xoApp.getCloudConfig(id))
  }

  /**
   * @example body { "name": "ubuntu base", "template": "#cloud-config\nhostname: {name}\n" }
   */
  @Extension('x-mcp-exposure', 'confirm')
  @Post('')
  @Middlewares(json())
  @SuccessResponse(createdResp.status, createdResp.description)
  @Response(invalidParametersResp.status, invalidParametersResp.description)
  async createCloudConfig(@Body() body: CreateCloudConfigBody): Promise<{ id: string }> {
    if (body.name.trim() === '') {
      throw invalidParameters('the name cannot be empty')
    }
    const { id } = await this.#restApi.xoApp.createCloudConfig({
      name: body.name,
      template: body.template,
      type: body.type === 'network' ? 'network' : undefined,
    })
    this.setStatus(createdResp.status)
    this.setHeader('Location', `${BASE_URL}/cloud-configs/${id}`)
    return { id }
  }

  /**
   * @example id "Bk-tkgSlz"
   * @example body { "template": "#cloud-config\nhostname: {name}\npackages: [htop]\n" }
   */
  @Extension('x-mcp-exposure', 'confirm')
  @Patch('{id}')
  @Middlewares(json())
  @SuccessResponse(noContentResp.status, noContentResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(invalidParametersResp.status, invalidParametersResp.description)
  async updateCloudConfig(@Path() id: string, @Body() body: UpdateCloudConfigBody): Promise<void> {
    if (body.name !== undefined && body.name.trim() === '') {
      throw invalidParameters('the name cannot be empty')
    }
    await this.#restApi.xoApp.updateCloudConfig({ id, ...body })
  }

  /**
   * @example id "Bk-tkgSlz"
   */
  @Extension('x-mcp-exposure', 'confirm')
  @Delete('{id}')
  @SuccessResponse(noContentResp.status, noContentResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  async deleteCloudConfig(@Path() id: string): Promise<void> {
    // fails with a not found error when the config does not exist
    await this.#restApi.xoApp.getCloudConfig(id)
    await this.#restApi.xoApp.deleteCloudConfig(id)
  }
}
