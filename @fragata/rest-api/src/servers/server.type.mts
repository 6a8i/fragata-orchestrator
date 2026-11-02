import { XoServer } from '@fragata/types'

export interface InsertableXoServer extends Pick<XoServer, 'host' | 'httpProxy' | 'label' | 'username'> {
  allowUnauthorized?: XoServer['allowUnauthorized']
  password: string
  readOnly?: XoServer['readOnly']
}

export type UpdateXoServerBody = {
  label?: string | null
  host?: string
  username?: string
  /** changing the address or the credentials reconnects the server */
  password?: string
  allowUnauthorized?: boolean
  readOnly?: boolean
  httpProxy?: string | null
}
