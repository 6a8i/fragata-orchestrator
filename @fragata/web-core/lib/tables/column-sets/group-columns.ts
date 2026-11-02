import { defineColumns } from '@core/packages/table/define-columns.ts'
import { useSelectItemColumn } from '@core/tables/column-definitions/select-item-column.ts'
import { useTruncatedTextColumn } from '@core/tables/column-definitions/truncated-text-column.ts'
import { useI18n } from 'vue-i18n'

export const useGroupColumns = defineColumns(() => {
  const { t } = useI18n()

  return {
    name: useTruncatedTextColumn({ headerLabel: () => t('name') }),
    members: useTruncatedTextColumn({ headerLabel: () => t('members') }),
    roles: useTruncatedTextColumn({ headerLabel: () => t('roles') }),
    selectItem: useSelectItemColumn(),
  }
})

export const useAclRoleColumns = defineColumns(() => {
  const { t } = useI18n()

  return {
    name: useTruncatedTextColumn({ headerLabel: () => t('name') }),
    description: useTruncatedTextColumn({ headerLabel: () => t('description') }),
    kind: useTruncatedTextColumn({ headerLabel: () => t('type') }),
    assignments: useTruncatedTextColumn({ headerLabel: () => t('assigned-to') }),
    selectItem: useSelectItemColumn(),
  }
})
