export type UpdatePifBody = {
  /**
   * New VLAN tag (VLAN PIFs only)
   * @minimum 0
   * @maximum 4094
   */
  vlan?: number
}

export type ReconfigurePifIpBody = {
  mode: 'None' | 'DHCP' | 'Static'
  /** Required with `Static` */
  ip?: string
  /** Required with `Static` */
  netmask?: string
  gateway?: string
  /** Comma separated DNS servers */
  dns?: string
}
