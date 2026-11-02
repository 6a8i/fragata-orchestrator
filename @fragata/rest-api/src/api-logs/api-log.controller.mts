import { Controller, Delete, Extension, Get, Path, Query, Response, Route, Security, SuccessResponse, Tags } from 'tsoa'
import { inject } from 'inversify'
import { provide } from 'inversify-binding-decorators'

import { badRequestResp, noContentResp, unauthorizedResp } from '../open-api/common/response.common.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'
import type { ApiLog } from './api-log.type.mjs'

const NAMESPACE = 'api'

/**
 * Failed API calls: who called what, with which parameters, and the error. Administrators only.
 */
@Route('api-logs')
@Security('*')
@Response(badRequestResp.status, badRequestResp.description)
@Response(unauthorizedResp.status, unauthorizedResp.description)
@Tags('api-logs')
@provide(ApiLogController)
export class ApiLogController extends Controller {
  #restApi: RestApi

  constructor(@inject(RestApi) restApi: RestApi) {
    super()
    this.#restApi = restApi
  }

  /**
   * Most recent first.
   *
   * @example limit 100
   */
  @Extension('x-mcp-exposure', 'allow')
  @Get('')
  async getApiLogs(@Query() limit?: number): Promise<ApiLog[]> {
    const logs = await this.#restApi.xoApp.getLogs(NAMESPACE)
    const sorted = Object.entries(logs)
      .map(([id, { level, message, data = {}, time }]) => ({
        id,
        time,
        level,
        message,
        method: data.method as string | undefined,
        userId: data.userId as string | undefined,
        params: data.params,
        error: data.error,
        duration: data.duration as number | undefined,
      }))
      .sort((a, b) => b.time - a.time)
    return limit === undefined ? sorted : sorted.slice(0, limit)
  }

  /**
   * @example id "1730551234567"
   */
  @Extension('x-mcp-exposure', 'confirm')
  @Delete('{id}')
  @SuccessResponse(noContentResp.status, noContentResp.description)
  async deleteApiLog(@Path() id: string): Promise<void> {
    const logger = await this.#restApi.xoApp.getLogger(NAMESPACE)
    logger.del(id)
  }

  @Extension('x-mcp-exposure', 'confirm')
  @Delete('')
  @SuccessResponse(noContentResp.status, noContentResp.description)
  async deleteApiLogs(): Promise<void> {
    const [logger, logs] = await Promise.all([
      this.#restApi.xoApp.getLogger(NAMESPACE),
      this.#restApi.xoApp.getLogs(NAMESPACE),
    ])
    logger.del(Object.keys(logs))
  }
}
