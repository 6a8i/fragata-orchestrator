import {
  Body,
  Controller,
  Extension,
  Header,
  Middlewares,
  Post,
  Request,
  Response,
  Route,
  Security,
  SuccessResponse,
  Tags,
} from 'tsoa'
import type { Request as ExRequest } from 'express'
import { inject } from 'inversify'
import { provide } from 'inversify-binding-decorators'
import { json } from 'express'
import { Readable } from 'node:stream'
import { invalidParameters } from 'fragata-common/api-errors.js'

import {
  badRequestResp,
  invalidParameters as invalidParametersResp,
  noContentResp,
  unauthorizedResp,
} from '../open-api/common/response.common.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'
import type { ExportConfigBody } from './config.type.mjs'

/**
 * Backup and restore of the configuration of the orchestrator: users, groups, ACLs, servers, backup jobs,
 * repositories, plugins… Administrators only.
 */
@Route('config')
@Security('*')
@Response(badRequestResp.status, badRequestResp.description)
@Response(unauthorizedResp.status, unauthorizedResp.description)
@Tags('config')
@provide(ConfigController)
export class ConfigController extends Controller {
  #restApi: RestApi

  constructor(@inject(RestApi) restApi: RestApi) {
    super()
    this.#restApi = restApi
  }

  /**
   * Downloads the configuration, gzipped. With a passphrase, the file is encrypted (OpenPGP); a passphrase is
   * required when the credentials of the database are encrypted.
   *
   * @example body { "passphrase": "correct horse battery staple" }
   */
  @Extension('x-mcp-exposure', 'deny')
  @Post('actions/export')
  @Middlewares(json())
  @SuccessResponse(200, 'Download started', 'application/octet-stream')
  async exportConfig(@Body() body: ExportConfigBody): Promise<Readable> {
    const passphrase = body.passphrase === '' ? undefined : body.passphrase
    const config = await this.#restApi.xoApp.exportConfig({ compress: true, entries: body.entries, passphrase })

    const date = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `fragata-config_${date}.json.gz${passphrase === undefined ? '' : '.enc'}`
    const buffer = typeof config === 'string' ? Buffer.from(config) : config
    this.setHeader('content-disposition', `attachment; filename="${filename}"`)
    this.setHeader('content-type', 'application/octet-stream')
    this.setHeader('content-length', String(buffer.length))
    return Readable.from([buffer])
  }

  /**
   * Imports a configuration file made by the export, as the raw body. The imported entries replace the current
   * ones.
   */
  // For this endpoint, the requestBody type is written directly to `tsoa.json` because TSOA does not provide a decorator for "octet-stream" file uploads
  @Extension('x-mcp-exposure', 'deny')
  @Post('actions/import')
  @SuccessResponse(noContentResp.status, noContentResp.description)
  @Response(invalidParametersResp.status, invalidParametersResp.description)
  async importConfig(
    @Request() req: ExRequest,
    /** the passphrase given at export, if any */
    @Header('x-config-passphrase') passphrase?: string
  ): Promise<void> {
    const chunks: Buffer[] = []
    for await (const chunk of req) {
      chunks.push(chunk as Buffer)
    }
    const config = Buffer.concat(chunks)
    if (config.length === 0) {
      throw invalidParameters('the body must be a configuration file')
    }

    try {
      await this.#restApi.xoApp.importConfig(config, { passphrase: passphrase === '' ? undefined : passphrase })
    } catch (error) {
      // a wrong passphrase or a file that is not an export
      throw invalidParameters((error as Error).message)
    }
  }
}
