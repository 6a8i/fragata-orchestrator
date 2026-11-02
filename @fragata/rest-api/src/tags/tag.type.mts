export type Tag = {
  id: string
  /** `#rrggbb` */
  color?: string
  objectCount: number
}

export type UpdateTagBody = {
  /** `#rrggbb`, or `null` to remove the color */
  color?: string | null
}
