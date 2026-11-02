import { fetchDelete, fetchPatch, fetchPost, fetchPut } from '@/shared/utils/fetch.util.ts'

// Thin wrappers over the REST API for groups and ACL roles. Each call is a
// single request: the collections are refreshed by the server events.

export const createGroup = (name: string) => fetchPost<{ id: string }>('groups', { name })
export const renameGroup = (groupId: string, name: string) => fetchPatch(`groups/${groupId}`, { name })
export const deleteGroup = (groupId: string) => fetchDelete(`groups/${groupId}`)
export const addUserToGroup = (groupId: string, userId: string) => fetchPut(`groups/${groupId}/users/${userId}`)
export const removeUserFromGroup = (groupId: string, userId: string) => fetchDelete(`groups/${groupId}/users/${userId}`)

export const copyAclRole = (roleId: string, name: string) =>
  fetchPost<{ id: string }>(`acl-roles/${roleId}/actions/copy?sync=true`, { name })
export const deleteAclRole = (roleId: string) => fetchDelete(`acl-roles/${roleId}`)
export const assignAclRoleToUser = (roleId: string, userId: string) => fetchPut(`acl-roles/${roleId}/users/${userId}`)
export const unassignAclRoleFromUser = (roleId: string, userId: string) =>
  fetchDelete(`acl-roles/${roleId}/users/${userId}`)
export const assignAclRoleToGroup = (roleId: string, groupId: string) =>
  fetchPut(`acl-roles/${roleId}/groups/${groupId}`)
export const unassignAclRoleFromGroup = (roleId: string, groupId: string) =>
  fetchDelete(`acl-roles/${roleId}/groups/${groupId}`)
