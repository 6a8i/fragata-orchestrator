import type { Readable } from 'node:stream'
import type { Request, Response } from 'express'
import type { SecurityName } from '@fragata/types'

export type MaybePromise<T> = T | Promise<T>

export type WithHref<T> = T & { href: string }

/**
 * Represents an `fragata-common/api-errors` error
 * @see https://github.com/6a8i/fragata-fleet/blob/master/packages/fragata-common/api-errors.js
 */
export interface XoError extends Error {
  code: number
  data?: Record<string, unknown>
}

export type NdjsonStream = Readable

export type SendObjects<T> = Promise<string[] | WithHref<T>[] | NdjsonStream | string>

export type PromiseWriteInStreamError = { error: true }

export type AuthenticatedRequest = Request & {
  res: Response & {
    locals: {
      authType: Omit<SecurityName, '*'>
      [key: string]: unknown
    }
  }
}

export type IsEmptyData = { isEmpty: true }

export type IsMaybeExpired<T> = T & { isExpired?: true }

export type ReplaceKey<Type, OldKey extends keyof Type, NewKey extends string, NewKeyType = Type[OldKey]> = Omit<
  Type,
  OldKey
> &
  Record<NewKey, NewKeyType>

export type SafeOmit<T, K extends keyof T> = T extends T ? Omit<T, K> : never

// Force tsoa to resolve the computed type (conditional/distributive types otherwise produce a self-referencing schema)
export type Simplify<T> = { [K in keyof T]: T[K] }
