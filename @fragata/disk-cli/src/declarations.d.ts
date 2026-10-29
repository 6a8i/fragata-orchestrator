declare module 'promise-toolbox/Disposable' {
  interface DisposableLike<T> {
    value: T
    dispose(): void | Promise<void>
  }

  const Disposable: {
    use<T, R>(
      disposable: DisposableLike<T> | PromiseLike<DisposableLike<T>>,
      fn: (value: T) => R | Promise<R>
    ): Promise<R>
  }

  export default Disposable
}

declare module '@fragata/fs' {
  export interface RemoteHandler {
    list(dir: string, opts?: { prependDir?: boolean }): Promise<string[]>
    [key: string]: unknown
  }

  export interface HandlerDisposable {
    value: RemoteHandler
    dispose: () => Promise<void>
  }

  export function getSyncedHandler(remote: { url: string }): Promise<HandlerDisposable>
}

declare module 'vhd-lib/disk-consumer/index.mjs' {
  import type { Readable } from 'node:stream'
  import type { RandomAccessDisk } from '@fragata/disk-transform'
  export function toVhdStream(disk: RandomAccessDisk): Promise<Readable>
}

declare module '@fragata/backup-archive/disks/openDiskChain.mjs' {
  import type { RemoteHandler } from '@fragata/fs'
  import type { RandomAccessDisk } from '@fragata/disk-transform'

  export function openDiskChain(params: {
    handler: RemoteHandler
    path: string
    until?: string
    ignoreBlockIndexes?: boolean
  }): Promise<RandomAccessDisk>
}

declare module '@fragata/backup-archive/disks' {
  import type { RemoteHandler } from '@fragata/fs'
  import type { RandomAccessDisk } from '@fragata/disk-transform'

  export interface RemoteDisk extends RandomAccessDisk {
    getSizeOnDisk(): number
    getPath(): string
    getPaths(): string[]
    getUuid(): string
    getParentUuid(): string
    getParentPath(): string
    getMaxBlockCount(): number
  }

  export interface DiskDisposable {
    value: RemoteDisk
    dispose: () => Promise<void>
  }

  export function isDisk(path: string): boolean

  export function openDisposableDisk(params: {
    handler: RemoteHandler
    path: string
    force?: boolean
    ignoreBlockIndexes?: boolean
  }): Promise<DiskDisposable>

  // Returns a RemoteVhdDiskChain, which is a RemoteDisk exposing getPaths() over the whole lineage.
  export function openDiskChain(params: {
    handler: RemoteHandler
    path: string
    until?: string
    ignoreBlockIndexes?: boolean
  }): Promise<RemoteDisk>
}
