import { defineColumns } from '@core/packages/table/define-columns.ts'
import { useSelectItemColumn } from '@core/tables/column-definitions/select-item-column.ts'
import { useTruncatedTextColumn } from '@core/tables/column-definitions/truncated-text-column.ts'
import { useI18n } from 'vue-i18n'

export const useResourceSetColumns = defineColumns(() => {
  const { t } = useI18n()

  return {
    name: useTruncatedTextColumn({ headerLabel: () => t('name') }),
    subjects: useTruncatedTextColumn({ headerLabel: () => t('resource-set:subjects') }),
    objects: useTruncatedTextColumn({ headerLabel: () => t('resource-set:objects') }),
    cpus: useTruncatedTextColumn({ headerLabel: () => t('vcpus') }),
    memory: useTruncatedTextColumn({ headerLabel: () => t('ram') }),
    disk: useTruncatedTextColumn({ headerLabel: () => t('disk-space') }),
    selectItem: useSelectItemColumn(),
  }
})
