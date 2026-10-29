import type { TrafficRule } from '@fragata/types'

export type EnrichedTrafficRule = TrafficRule & {
  order: number
  directionA: string
  directionB: string
  directionLabel: string
  objectLabel: string
}
