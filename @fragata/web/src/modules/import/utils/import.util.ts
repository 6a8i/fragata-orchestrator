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
