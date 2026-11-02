import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import type { XoUser } from '@fragata/types'

// the signed-in user (`me` is resolved by the REST API)
export const useXoCurrentUser = defineRemoteResource({
  url: `${BASE_URL}/users/me?fields=id,permission`,
  cacheExpirationMs: false,
  pollingIntervalMs: false,
  initialData: () => undefined as Pick<XoUser, 'id' | 'permission'> | undefined,
  state: currentUser => ({ currentUser }),
})
