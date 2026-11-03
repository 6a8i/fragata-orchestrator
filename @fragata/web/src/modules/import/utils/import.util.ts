import { BASE_URL } from '@/shared/utils/fetch.util.ts'

export type DiskFormat = 'vhd' | 'raw'

/** format of a disk file from its name: VHD, or raw for `.raw`, `.img` and `.iso` */
export function diskFormatFromName(name: string): DiskFormat | undefined {
  const extension = name.toLowerCase().split('.').pop()
  switch (extension) {
    case 'vhd':
      return 'vhd'
    case 'raw':
    case 'img':
    case 'iso':
      return 'raw'
    default:
      return undefined
  }
}

/** the name of a file without its extension */
export function baseName(name: string): string {
  const index = name.lastIndexOf('.')
  return index > 0 ? name.slice(0, index) : name
}

/** sends a file as the raw body of a POST, resolves to the JSON answer */
export async function uploadFile<T>(endpoint: string, file: File): Promise<T> {
  const response = await fetch(`${BASE_URL}/${endpoint}`, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/octet-stream' },
    body: file,
  })
  const body = await response.json().catch(() => undefined)
  if (!response.ok) {
    throw new Error(typeof body?.error === 'string' ? body.error : response.statusText)
  }
  return body as T
}

export function isOvaFile(name: string): boolean {
  return name.toLowerCase().endsWith('.ova')
}

export type OvaImportOptions = {
  sr: string
  /** all the network interfaces of the OVF; the management network of the pool when undefined */
  network?: string
  nameLabel?: string
  fileName?: string
}

/** the REST endpoint receiving an OVA file, the server parses it */
export function ovaImportEndpoint(poolId: string, { sr, network, nameLabel, fileName }: OvaImportOptions): string {
  const query = new URLSearchParams({ sr })
  if (network !== undefined) {
    query.set('network', network)
  }
  if (nameLabel !== undefined && nameLabel !== '') {
    query.set('name_label', nameLabel)
  }
  if (fileName !== undefined) {
    query.set('filename', fileName)
  }
  return `pools/${poolId}/actions/import_ova?${query}`
}

/** the error message of a failed REST call, from its JSON answer */
export function errorMessageFromResponse(responseText: string, statusText: string): string {
  try {
    const body = JSON.parse(responseText)
    if (typeof body?.error === 'string') {
      return body.error
    }
  } catch {
    // not JSON
  }
  return statusText || 'upload failed'
}

/**
 * sends a file as the raw body of a POST like `uploadFile`, reporting the progress of the upload
 * (`fetch` cannot report it), resolves to the JSON answer
 */
export function uploadFileWithProgress<T>(
  endpoint: string,
  file: File,
  onProgress: (progress: { loaded: number; total: number }) => void
): Promise<T> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest()
    request.open('POST', `${BASE_URL}/${endpoint}`)
    request.withCredentials = true
    request.setRequestHeader('Content-Type', 'application/octet-stream')
    request.upload.onprogress = event => {
      onProgress({ loaded: event.loaded, total: event.lengthComputable ? event.total : file.size })
    }
    request.onerror = () => reject(new Error('network error during the upload'))
    request.onabort = () => reject(new Error('upload aborted'))
    request.onload = () => {
      if (request.status < 200 || request.status >= 300) {
        reject(new Error(errorMessageFromResponse(request.responseText, request.statusText)))
        return
      }
      try {
        resolve((request.responseText === '' ? undefined : JSON.parse(request.responseText)) as T)
      } catch (error) {
        reject(error)
      }
    }
    request.send(file)
  })
}
