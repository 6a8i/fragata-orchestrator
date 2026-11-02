export type EsxiConnectionBody = {
  /** address of the ESXi or vCenter host */
  host: string
  user: string
  password: string
  /** `false` accepts a self-signed certificate */
  sslVerify?: boolean
}

export type EsxiVm = {
  id: string
  nameLabel: string
  /** bytes */
  memory: number
  nCpus: number
  firmware: string
  powerState: string
  /** `false` when a disk cannot be read directly (vSAN, raw device): the VM cannot be imported */
  hasAllExtentsListed: boolean
  /** bytes */
  storage: { used: number; free: number }
}

export type ImportFromEsxiBody = EsxiConnectionBody & {
  /** ids of the VMs on the VMware host */
  vms: string[]
  sr: string
  network: string
  template: string
  /** stops the source VM for the last delta */
  stopSource?: boolean
}

export type ImportFromEsxiResult = {
  /** VMware id → UUID of the new VM */
  imported: Record<string, string>
  /** VMware id → error */
  errors: Record<string, string>
}
