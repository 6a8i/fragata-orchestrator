import { createLogger } from '@fragata/log'
import { invalidCredentials } from 'fragata-common/api-errors.js'
import type { XapiXoRecord, XoApp, XoUser } from '@fragata/types'
import type { AnyPrivilege } from '@fragata/acl'

import type { Container } from 'inversify'
import { safeParseComplexMatcher } from '../helpers/utils.helper.mjs'

const log = createLogger('xo:rest-api:error-handler')

// Event listeners (SSE, task streams) resolve the user and its ACL privileges
// for every event and every subscriber, which costs a Redis round trip and a
// decrypt each time. Both change rarely: keep them for a short while.
const USER_PRIVILEGES_TTL = 2_000

type UserWithPrivileges = { user: XoUser; userPrivileges: AnyPrivilege[] }

export class RestApi {
  #ioc: Container
  #xoApp: XoApp
  #userWithPrivilegesCache = new Map<XoUser['id'], { expires: number; promise: Promise<UserWithPrivileges> }>()

  constructor(xoApp: XoApp, iocContainer: Container) {
    this.#xoApp = xoApp
    this.#ioc = iocContainer
  }

  get tasks() {
    return this.#xoApp.tasks
  }

  get xoApp() {
    return this.#xoApp
  }

  get ioc() {
    return this.#ioc
  }

  /**
   * The user and its ACL v2 privileges (empty for administrators), cached for
   * a couple of seconds: meant for event listeners, not for request handling.
   */
  getUserWithPrivileges(userId: XoUser['id']): Promise<UserWithPrivileges> {
    const now = Date.now()
    const cached = this.#userWithPrivilegesCache.get(userId)
    if (cached !== undefined && cached.expires > now) {
      return cached.promise
    }

    const promise = (async (): Promise<UserWithPrivileges> => {
      const user = await this.#xoApp.getUser(userId)
      const userPrivileges =
        user.permission === 'admin' ? [] : ((await this.#xoApp.getAclV2UserPrivileges(user.id)) as AnyPrivilege[])
      return { user, userPrivileges }
    })()
    promise.catch(() => this.#userWithPrivilegesCache.delete(userId))
    this.#userWithPrivilegesCache.set(userId, { expires: now + USER_PRIVILEGES_TTL, promise })

    return promise
  }

  authenticateUser(...args: Parameters<XoApp['authenticateUser']>) {
    return this.#xoApp.authenticateUser(...args)
  }

  getCurrentUser(opts?: { throwUnauthenticated?: true }): XoUser
  getCurrentUser(opts: { throwUnauthenticated: false }): undefined | XoUser
  getCurrentUser(opts?: { throwUnauthenticated?: boolean }): undefined | XoUser
  getCurrentUser({ throwUnauthenticated = true }: { throwUnauthenticated?: boolean } = {}): undefined | XoUser {
    const user = this.#xoApp.apiContext.user

    if (user === undefined && throwUnauthenticated) {
      log.error('getCurrentUser received an unauthenticated API call')
      throw invalidCredentials()
    }

    return user
  }

  getObject<T extends XapiXoRecord>(id: T['id'], type?: T['type'] | T['type'][]) {
    return this.#xoApp.getObject(id, type)
  }

  getObjectsByType<T extends XapiXoRecord>(
    type: T['type'],
    { filter, ...opts }: { filter?: string | ((obj: T) => boolean); limit?: number } = {}
  ): Record<T['id'], T> {
    if (filter !== undefined && typeof filter === 'string') {
      filter = safeParseComplexMatcher(filter).createPredicate()
    }
    return this.#xoApp.getObjectsByType(type, { filter, ...opts }) ?? ({} as Record<T['id'], T>)
  }

  getXapiObject<T extends XapiXoRecord>(maybeId: T['id'] | T, type: T['type'] | T['type'][]) {
    return this.#xoApp.getXapiObject<T>(maybeId, type)
  }

  runWithApiContext(...args: Parameters<XoApp['runWithApiContext']>) {
    return this.#xoApp.runWithApiContext(...args)
  }
}
