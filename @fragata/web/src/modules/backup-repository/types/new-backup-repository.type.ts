import type { BackupRepositoryUrlInput } from 'fragata-remote-parser'

export type BackupRepositoryDetailsPayload = {
  urlInfo: BackupRepositoryUrlInput
  options?: string
}
