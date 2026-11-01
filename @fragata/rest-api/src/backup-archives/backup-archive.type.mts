export interface MountLiveDiskBody {
  /** One of the archive's `disks[].id`. */
  diskId: string
  /** Host to which the disk will be attached. */
  hostId: string
}

export interface RestoreBackupArchiveBody {
  /** Storage repository the restored VM disks are created on. */
  srId: string
  /** Give the restored VM new MAC addresses instead of the original ones. */
  generateNewMacAddresses?: boolean
  /** Prepended to the name of the restored VM. */
  vmNamePrefix?: string
  /** Tag added to the restored VM. */
  additionalVmTag?: string
  /** Reuse an existing snapshot of the VM on the target to transfer only the differences. */
  useDifferentialRestore?: boolean
  /** Start the VM once restored. */
  startOnRestore?: boolean
}
