import type { XenApiSr } from '@/libs/xen-api/xen-api.types.ts'
import { useQueryBuilderSchema } from '@core/packages/query-builder/schema/use-query-builder-schema.ts'
import { useBooleanSchema } from '@core/utils/query-builder/use-boolean-schema.ts'
import { useStringSchema } from '@core/utils/query-builder/use-string-schema.ts'
import { useI18n } from 'vue-i18n'

export function useSrQueryBuilderSchema() {
  const { t } = useI18n()

  return useQueryBuilderSchema<XenApiSr>({
    '': useStringSchema(t('any-property')),
    name_label: useStringSchema(t('name')),
    name_description: useStringSchema(t('description')),
    type: useStringSchema(t('storage-format')),
    shared: useBooleanSchema(t('access-mode'), {
      true: t('shared'),
      false: t('local'),
    }),
  })
}
