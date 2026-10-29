declare module '@fragata/log' {
  export interface Logger {
    debug(message: string, data?: Record<string, unknown>): void
    info(message: string, data?: Record<string, unknown>): void
    warn(message: string, data?: Record<string, unknown>): void
    error(message: string, data?: Record<string, unknown>): void
  }

  export function createLogger(namespace: string): Logger
}

declare module '@fragata/coalesce-calls' {
  export function coalesceCalls<T extends (...args: never[]) => Promise<unknown>>(fn: T): T
}

declare module '@fragata/async-each' {
  export interface AsyncEachOptions {
    concurrency?: number
    signal?: AbortSignal
    stopOnError?: boolean
  }

  export function asyncEach<T>(
    iterable: Iterable<T> | AsyncIterable<T>,
    iteratee: (item: T, index: number) => Promise<void> | void,
    options?: AsyncEachOptions
  ): Promise<void>
}
