import { defineColumns } from '@core/packages/table/define-columns.ts'
import { useSelectItemColumn } from '@core/tables/column-definitions/select-item-column.ts'
import { useTruncatedTextColumn } from '@core/tables/column-definitions/truncated-text-column.ts'
import { useI18n } from 'vue-i18n'

export const useIpPoolColumns = defineColumns(() => {
  const { t } = useI18n()

  return {
    name: useTruncatedTextColumn({ headerLabel: () => t('name') }),
    addresses: useTruncatedTextColumn({ headerLabel: () => t('ip-addresses') }),
    allocated: useTruncatedTextColumn({ headerLabel: () => t('ip-pool:allocated') }),
    networks: useTruncatedTextColumn({ headerLabel: () => t('networks') }),
    selectItem: useSelectItemColumn(),
  }
})
