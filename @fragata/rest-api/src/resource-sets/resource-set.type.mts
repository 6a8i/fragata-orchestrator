/** `cpus`, `memory` (bytes), `disk` (bytes) or `ipPool:<id>` → quota */
export type ResourceSetQuotas = {
  [key: string]: number
}

export type ResourceSet = {
  id: string
  name: string
  subjects: string[]
  objects: string[]
  ipPools: string[]
  limits: Record<string, { total?: number; usage: number }>
  shareByDefault: boolean
  tags: string[]
  href: string
}

export type CreateResourceSetBody = {
  name: string
  /** ids of the users and groups allowed to use the set */
  subjects?: string[]
  /** ids of the templates, SRs and networks of the set */
  objects?: string[]
  ipPools?: string[]
  /** `cpus`, `memory` (bytes), `disk` (bytes) or `ipPool:<id>` → quota */
  limits?: ResourceSetQuotas
  shareByDefault?: boolean
  tags?: string[]
}

export type UpdateResourceSetBody = {
  name?: string
  subjects?: string[]
  objects?: string[]
  ipPools?: string[]
  limits?: ResourceSetQuotas
  shareByDefault?: boolean
  tags?: string[]
}

export type CreateVmInResourceSetBody = {
  name_label: string
  name_description?: string
  /** UUID of a template of the set */
  template: string
  cpus?: number
  /** bytes */
  memory?: number
  /** new disks, on SRs of the set */
  vdis?: { name_label: string; size: number; sr: string }[]
  /** VIFs on networks of the set; the VIFs of the template are replaced */
  vifs?: { network: string }[]
  cloud_config?: string
  network_config?: string
  boot?: boolean
  /** gives every subject of the set access to the VM (default: the share setting of the set) */
  share?: boolean
}
