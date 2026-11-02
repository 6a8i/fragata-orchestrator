export type WarmMigrateVmBody = {
  /** SR of the destination pool */
  srId: string
  /** defaults to `true` */
  startDestinationVm?: boolean
  /** defaults to `false`: the source VM is kept, halted */
  deleteSourceVm?: boolean
}
