export type CloudConfig = {
  id: string
  name: string
  template: string
  /** `user` for user data, `network` for a network configuration */
  type: 'user' | 'network'
  href: string
}

export type CreateCloudConfigBody = {
  name: string
  template: string
  /** defaults to `user` */
  type?: 'user' | 'network'
}

export type UpdateCloudConfigBody = {
  name?: string
  template?: string
}
