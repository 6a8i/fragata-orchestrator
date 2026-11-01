import { fetchPost } from '@/shared/utils/fetch.util.ts'

// The probes are host actions; `sync=true` returns their result directly
// instead of a task to follow.

export type NfsExport = { path: string; acl: string }
export type IscsiIqn = { iqn: string; ip: string }
export type IscsiLun = { id: string; vendor: string; serial: string; size?: string; scsiId: string }

export function probeNfs(hostId: string, server: string, nfsVersion?: string): Promise<NfsExport[]> {
  return fetchPost<NfsExport[]>(`hosts/${hostId}/actions/probe_nfs?sync=true`, {
    server,
    ...(nfsVersion !== undefined && nfsVersion !== '' && { nfsVersion }),
  })
}

export function probeIscsiIqns(
  hostId: string,
  target: { targetIp: string; port?: number; chapUser?: string; chapPassword?: string }
): Promise<IscsiIqn[]> {
  return fetchPost<IscsiIqn[]>(`hosts/${hostId}/actions/probe_iscsi_iqns?sync=true`, target)
}

export function probeIscsiLuns(
  hostId: string,
  target: { targetIp: string; targetIqn: string; port?: number; chapUser?: string; chapPassword?: string }
): Promise<IscsiLun[]> {
  return fetchPost<IscsiLun[]>(`hosts/${hostId}/actions/probe_iscsi_luns?sync=true`, target)
}
