export type IpPool = {
  id: string
  name: string
  /** every address of the pool */
  addresses: string[]
  /** addresses currently allocated to a VIF */
  allocatedAddresses: string[]
  /** ids of the networks the pool applies to */
  networks: string[]
  href: string
}

export type CreateIpPoolBody = {
  name: string
  /** single addresses or IPv4 ranges such as `192.168.1.10-192.168.1.50` */
  addresses?: string[]
  networks?: string[]
}

export type UpdateIpPoolBody = {
  name?: string
  /** replaces the whole list; single addresses or IPv4 ranges */
  addresses?: string[]
  networks?: string[]
}
