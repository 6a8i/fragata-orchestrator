import { useWatchCollection } from '@/shared/composables/watch-collection.composable.ts'
import { useXoCollectionState } from '@/shared/composables/xo-collection-state/use-xo-collection-state.ts'
import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import type { XoAclRole, XoGroup, XoUser } from '@fragata/types'

// template roles have no `userIds`/`groupIds`: they are copied into regular roles to be applied
export type FrontXoAclRole = {
  id: XoAclRole['id']
  name: string
  description?: string
  privilegeIds: XoAclRole['privilegeIds']
  userIds?: XoUser['id'][]
  groupIds?: XoGroup['id'][]
  isTemplate?: boolean
}

const aclRoleFields = ['id', 'name', 'description', 'privilegeIds', 'userIds', 'groupIds', 'isTemplate']

export const useXoAclRoleCollection = defineRemoteResource({
  url: `${BASE_URL}/acl-roles?fields=${aclRoleFields.join(',')}&ndjson=true`,
  stream: true,
  initWatchCollection: () => useWatchCollection({ resource: 'acl-role', fields: aclRoleFields }),
  initialData: () => [] as FrontXoAclRole[],
  state: (aclRoles, context) =>
    useXoCollectionState(aclRoles, {
      context,
      baseName: 'aclRole',
    }),
})
