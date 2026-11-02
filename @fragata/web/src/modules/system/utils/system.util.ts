import { ApiError } from '@/shared/error/api.error.ts'

export const TAG_COLOR_REGEX = /^#[0-9a-f]{6}$/i

export function isTagColor(color: string) {
  return TAG_COLOR_REGEX.test(color)
}

/** the message of an error thrown by the fetch utilities, or of the error a REST call answered with */
export function toErrorMessage(error: unknown): string {
  const cause = error instanceof ApiError ? error.cause?.error : undefined
  if (typeof cause === 'string') {
    return cause
  }
  return error instanceof Error ? error.message : String(error)
}

/** the message of the error recorded by a failed API call */
export function apiLogErrorMessage(error: unknown): string | undefined {
  if (error === undefined || error === null) {
    return undefined
  }
  if (typeof error === 'string') {
    return error
  }
  if (typeof error === 'object') {
    const { message, code } = error as { message?: unknown; code?: unknown }
    if (typeof message === 'string' && message !== '') {
      return message
    }
    if (code !== undefined) {
      return String(code)
    }
  }
  return JSON.stringify(error)
}

/** `filename` of a `content-disposition` header, or the fallback */
export function filenameFromDisposition(disposition: string | null, fallback: string): string {
  const match = disposition?.match(/filename="?([^";]+)"?/)
  return match?.[1] ?? fallback
}
