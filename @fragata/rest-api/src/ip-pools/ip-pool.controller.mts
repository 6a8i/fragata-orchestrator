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
import type { XoIpPool } from '@fragata/types'

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
import { expandAddresses } from './ip-pool.helper.mjs'
import type { CreateIpPoolBody, IpPool, UpdateIpPoolBody } from './ip-pool.type.mjs'

function toIpPool({ id, name, addresses = {}, networks = [] }: XoIpPool): IpPool {
  return {
    id,
    name,
    addresses: Object.keys(addresses),
    allocatedAddresses: Object.entries(addresses)
      .filter(([, { vifs = [] }]) => vifs.length > 0)
      .map(([address]) => address),
    networks,
    href: `${BASE_URL}/ip-pools/${id}`,
  }
}

/**
 * IP pools reserve addresses for the VIFs of some networks. Administrators only.
 */
@Route('ip-pools')
@Security('*')
@Response(badRequestResp.status, badRequestResp.description)
@Response(unauthorizedResp.status, unauthorizedResp.description)
@Tags('ip-pools')
@provide(IpPoolController)
export class IpPoolController extends Controller {
  #restApi: RestApi

  constructor(@inject(RestApi) restApi: RestApi) {
    super()
    this.#restApi = restApi
  }

  @Extension('x-mcp-exposure', 'allow')
  @Get('')
  async getIpPools(): Promise<IpPool[]> {
    const ipPools = await this.#restApi.xoApp.getAllIpPools()
    return ipPools.map(toIpPool)
  }

  /**
   * @example id "b7569d99-30f8-178a-7d94-801de3e29b5b"
   */
  @Extension('x-mcp-exposure', 'allow')
  @Get('{id}')
  @Response(notFoundResp.status, notFoundResp.description)
  async getIpPool(@Path() id: string): Promise<IpPool> {
    return toIpPool(await this.#restApi.xoApp.getIpPool(id))
  }

  /**
   * `addresses` accepts single addresses and IPv4 ranges such as `192.168.1.10-192.168.1.50`.
   *
   * @example body { "name": "lab", "addresses": ["192.168.1.10-192.168.1.50"], "networks": ["9fe12ca3-d75d-cfb0-492e-cfd2bc6c568f"] }
   */
  @Extension('x-mcp-exposure', 'confirm')
  @Post('')
  @Middlewares(json())
  @SuccessResponse(createdResp.status, createdResp.description)
  @Response(invalidParametersResp.status, invalidParametersResp.description)
  async createIpPool(@Body() body: CreateIpPoolBody): Promise<{ id: string }> {
    const addresses = Object.fromEntries(expandAddresses(body.addresses ?? []).map(address => [address, {}]))
    const id = await this.#restApi.xoApp.createIpPool({ name: body.name, addresses, networks: body.networks ?? [] })
    this.setStatus(createdResp.status)
    this.setHeader('Location', `${BASE_URL}/ip-pools/${id}`)
    return { id }
  }

  /**
   * `addresses`, when given, replaces the whole list: addresses no longer listed are released from their VIFs.
   *
   * @example id "b7569d99-30f8-178a-7d94-801de3e29b5b"
   * @example body { "name": "lab", "addresses": ["192.168.1.10-192.168.1.60"] }
   */
  @Extension('x-mcp-exposure', 'confirm')
  @Patch('{id}')
  @Middlewares(json())
  @SuccessResponse(noContentResp.status, noContentResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(invalidParametersResp.status, invalidParametersResp.description)
  async updateIpPool(@Path() id: string, @Body() body: UpdateIpPoolBody): Promise<void> {
    const xoApp = this.#restApi.xoApp
    let addresses: Record<string, object | null> | undefined

    if (body.addresses !== undefined) {
      const current = (await xoApp.getIpPool(id)).addresses ?? {}
      const wanted = new Set(expandAddresses(body.addresses))
      addresses = {}
      for (const address of Object.keys(current)) {
        if (!wanted.has(address)) {
          addresses[address] = null
        }
      }
      for (const address of wanted) {
        if (!(address in current)) {
          addresses[address] = {}
        }
      }
    }

    await xoApp.updateIpPool(id, { name: body.name, networks: body.networks, addresses })
  }

  /**
   * The addresses of the pool are released from their VIFs.
   *
   * @example id "b7569d99-30f8-178a-7d94-801de3e29b5b"
   */
  @Extension('x-mcp-exposure', 'confirm')
  @Delete('{id}')
  @SuccessResponse(noContentResp.status, noContentResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  async deleteIpPool(@Path() id: string): Promise<void> {
    await this.#restApi.xoApp.deleteIpPool(id)
  }
}
