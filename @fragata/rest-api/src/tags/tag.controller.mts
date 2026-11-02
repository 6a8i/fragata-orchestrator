import { Body, Controller, Extension, Get, Middlewares, Patch, Path, Response, Route, Security, SuccessResponse, Tags } from 'tsoa'
import { inject } from 'inversify'
import { provide } from 'inversify-binding-decorators'
import { json } from 'express'

import {
  badRequestResp,
  invalidParameters as invalidParametersResp,
  noContentResp,
  unauthorizedResp,
} from '../open-api/common/response.common.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'
import type { Tag, UpdateTagBody } from './tag.type.mjs'

/**
 * Tags of the objects, and their colors. Administrators only.
 */
@Route('tags')
@Security('*')
@Response(badRequestResp.status, badRequestResp.description)
@Response(unauthorizedResp.status, unauthorizedResp.description)
@Tags('tags')
@provide(TagController)
export class TagController extends Controller {
  #restApi: RestApi

  constructor(@inject(RestApi) restApi: RestApi) {
    super()
    this.#restApi = restApi
  }

  /**
   * Every tag used by an object or given a color, with the number of objects using it.
   */
  @Extension('x-mcp-exposure', 'allow')
  @Get('')
  async getTags(): Promise<Tag[]> {
    const tags = new Map<string, Tag>()
    const tagOf = (id: string) => {
      let tag = tags.get(id)
      if (tag === undefined) {
        tags.set(id, (tag = { id, objectCount: 0 }))
      }
      return tag
    }

    for (const object of Object.values(this.#restApi.xoApp.getObjects()) as unknown as { tags?: string[] }[]) {
      for (const id of object.tags ?? []) {
        tagOf(id).objectCount++
      }
    }
    for (const { id, color } of await this.#restApi.xoApp.getConfiguredTags()) {
      tagOf(id).color = color
    }

    return [...tags.values()].sort((a, b) => a.id.localeCompare(b.id))
  }

  /**
   * `null` removes the color.
   *
   * @example id "production"
   * @example body { "color": "#c62828" }
   */
  @Extension('x-mcp-exposure', 'confirm')
  @Patch('{id}')
  @Middlewares(json())
  @SuccessResponse(noContentResp.status, noContentResp.description)
  @Response(invalidParametersResp.status, invalidParametersResp.description)
  async updateTag(@Path() id: string, @Body() body: UpdateTagBody): Promise<void> {
    await this.#restApi.xoApp.setTag(id, body)
  }
}
