import { SUPPORTED_VDI_EXPORT_FORMAT } from '@fragata/types'

export const ORCHESTRATOR_NAME = 'Fragata'

const ORCHESTRATOR_REPO = 'https://github.com/6a8i/fragata-orchestrator'
const HOST_REPO = 'https://github.com/6a8i/fragata-host'

export const FRAGATA_LINKS = {
  NEWS: `${ORCHESTRATOR_REPO}/releases`,
  COMMUNITY: `${ORCHESTRATOR_REPO}/discussions`,
  DOC: `${ORCHESTRATOR_REPO}/tree/main/docs/docs`,
  DOC_SDN_CONTROLLER_MIGRATION: `${ORCHESTRATOR_REPO}/blob/main/docs/docs/manage-your-infrastructure/sdn_controller.md#migration-path`,
  DOC_SDN_CONTROLLER_XAPI_PLUGIN: `${ORCHESTRATOR_REPO}/blob/main/docs/docs/manage-your-infrastructure/sdn_controller.md#xapi-plugin`,
  TRANSLATION: `${ORCHESTRATOR_REPO}/tree/main/%40fragata/web-core/lib/locales`,
}

export const FRAGATA_HOST_LINKS = {
  NEWS: `${HOST_REPO}/releases`,
  COMMUNITY: `${HOST_REPO}/discussions`,
  DOC: `${HOST_REPO}#readme`,
  // technical reference inherited from the XCP-ng project until Fragata Host has its own docs
  GUEST_TOOLS: 'https://docs.xcp-ng.org/vms/#guest-tools',
}

export const RULE_STATUS = {
  ALLOW: 'allow',
  DROP: 'drop',
} as const

export const ONE_GB = 1024 ** 3

// sent by the API in place of a secret, see `@fragata/obfuscate`
export const OBFUSCATED_VALUE = 'obfuscated-q3oi6d9X8uenGvdLnHk2'

export const VDI_SOURCE = {
  EMPTY: 'empty',
  FILE: 'file',
  URL: 'url',
} as const

export type VdiExportFormat = Exclude<SUPPORTED_VDI_EXPORT_FORMAT, 'qcow2'>

export const VDI_PAGE_CONTEXT = {
  VM: 'vm',
  SR: 'sr',
  SNAPSHOT: 'snapshot',
  VDI_SNAPSHOT: 'vdi_snapshot',
} as const

export type VdiPageContext = (typeof VDI_PAGE_CONTEXT)[keyof typeof VDI_PAGE_CONTEXT]
