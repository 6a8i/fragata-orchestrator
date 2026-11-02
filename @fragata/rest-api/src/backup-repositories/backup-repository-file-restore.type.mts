export type BackupDiskBody = {
  /** `id` of a disk of a backup archive */
  disk: string
}

export type BackupPartition = {
  id: string
  name?: string
  size?: number
  type?: string
}

export type ListPartitionFilesBody = BackupDiskBody & {
  /** `id` of a partition; without it, the disk is read as one file system */
  partition?: string
  /** directory to list, ending with `/` */
  path: string
}

export type FetchPartitionFilesBody = BackupDiskBody & {
  partition?: string
  /** files and directories (ending with `/`) to download */
  paths: string[]
  /** defaults to `zip` */
  format?: 'zip' | 'tgz'
}

export type MetadataBackup = {
  id: string
  type: 'xo-config-backup' | 'xo-pool-metadata-backup'
  timestamp: number
  jobId?: string
  jobName?: string
  scheduleId?: string
  scheduleName?: string
  /** pool metadata backups: the pool saved */
  pool?: { uuid: string; name_label?: string }
  /** pool metadata backups: the primary host of the pool saved */
  poolMaster?: { uuid: string; name_label?: string }
}

export type RestoreMetadataBackupBody = {
  /** `id` of a metadata backup of this repository */
  backupId: string
  /** pool metadata backups: restores on this pool instead of the one saved */
  poolId?: string
}
