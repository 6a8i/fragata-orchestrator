export type ApiLog = {
  id: string
  /** milliseconds since epoch */
  time: number
  level: string
  message: string
  method?: string
  userId?: string
  params?: unknown
  error?: unknown
  /** milliseconds */
  duration?: number
}
