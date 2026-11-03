import { useMapper } from '@core/packages/mapper'
import type { ParsedBackupRepositoryUrl } from 'fragata-remote-parser'
import { type MaybeRefOrGetter, toValue } from 'vue'
import { useI18n } from 'vue-i18n'

type BackupRepositoryStorageMode = 'block' | 'file' | 'unknown'

export function useXoBackupRepositoryStorageModeLabel(
  rawParsedUrl: MaybeRefOrGetter<ParsedBackupRepositoryUrl | undefined>
) {
  const { t } = useI18n()

  return useMapper<BackupRepositoryStorageMode, string>(
    () => {
      const parsedUrl = toValue(rawParsedUrl)

      if (parsedUrl?.type === undefined) {
        return 'unknown'
      }

      return parsedUrl.useVhdDirectory ? 'block' : 'file'
    },
    {
      block: t('block-based'),
      file: t('file-based'),
      unknown: t('unknown'),
    },
    'unknown'
  )
}
