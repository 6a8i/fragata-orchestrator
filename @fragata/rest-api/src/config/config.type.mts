export type ExportConfigBody = {
  /** encrypts the file; required when the credentials of the database are encrypted */
  passphrase?: string
  /** only these entries (and the ones they depend on), e.g. `users`, `acls`, `jobs` */
  entries?: string[]
}
