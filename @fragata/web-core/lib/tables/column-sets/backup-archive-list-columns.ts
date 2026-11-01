import { defineColumns } from '@core/packages/table/define-columns.ts'
import { useDateColumn } from '@core/tables/column-definitions/date-column.ts'
import { useLinkOrTextColumn } from '@core/tables/column-definitions/link-or-text-column.ts'
import { useNumberColumn } from '@core/tables/column-definitions/number-column.ts'
import { useSelectItemColumn } from '@core/tables/column-definitions/select-item-column.ts'
import { useTextColumn } from '@core/tables/column-definitions/text-column.ts'
import { useI18n } from 'vue-i18n'

export const useBackupArchiveListColumns = defineColumns(() => {
  const { t } = useI18n()

  return {
    vm: useLinkOrTextColumn({ headerLabel: () => t('vm') }),
    date: useDateColumn({ headerLabel: () => t('date') }),
    mode: useTextColumn({ headerLabel: () => t('mode') }),
    backupRepository: useLinkOrTextColumn({ headerLabel: () => t('backup-repository') }),
    sizeOnDisk: useNumberColumn({ headerLabel: () => t('size-on-disk') }),
    selectItem: useSelectItemColumn(),
  }
})
