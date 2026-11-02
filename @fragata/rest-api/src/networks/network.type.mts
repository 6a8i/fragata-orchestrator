export type UpdateNetworkBody = {
  nameLabel?: string
  nameDescription?: string
  /**
   * @minimum 68
   * @maximum 9216
   */
  mtu?: number
  /** Add the network to new VMs automatically */
  automatic?: boolean
  /** VIFs of the network drop all traffic by default */
  defaultIsLocked?: boolean
  /** Use the network for NBD (TLS) */
  nbd?: boolean
  /** Use the network for NBD in clear: only on a network dedicated to backups */
  insecureNbd?: boolean
}
