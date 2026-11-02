import { XcpPatches, XsPatches } from '@fragata/types'

export type MissingPatchesInfo = {
  hasAuthorization: true
  nHostsWithMissingPatches: number
  nPoolsWithMissingPatches: number
  nHostsFailed: number
  missingPatches: XcpPatches[] | XsPatches[]
}

export type XoSrNfsExport = {
  path: string
  acl: string
}

export type XoSrHbaExport = {
  hba: string
  id: string
  lun: number
  path: string
  scsiId: string
  serial: string
  size: number
  vendor: string
}

export type XoSrIscsiLunsExport = {
  id: string
  vendor: string
  serial: string
  size?: string
  scsiId: string
}

export type XoSrIscsiIqnsExport = {
  iqn: string
  ip: string
}

export type UpdateHostBody = {
  nameLabel?: string
  nameDescription?: string
  /** iSCSI initiator name of the host */
  iscsiIqn?: string
  /** Changing it unplugs then replugs the shared SRs of the host */
  multipathing?: boolean
  /** Remote syslog destination (`host` or `host:port`), `null` to log locally only */
  syslogDestination?: string | null
}

export type InstallHostCertificateBody = {
  /** PEM encoded certificate */
  certificate: string
  /** PEM encoded private key of the certificate */
  privateKey: string
  /** PEM encoded intermediate certificates */
  chain?: string
}

export type SetControlDomainMemoryBody = {
  /**
   * Memory of the control domain, in bytes
   * @minimum 1
   */
  memory: number
}
