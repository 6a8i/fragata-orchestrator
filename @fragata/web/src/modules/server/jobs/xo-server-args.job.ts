import { defineJobArg } from '@core/packages/job'
import type { XoServer } from '@fragata/types'
import type { Ref } from 'vue'

export const xoServerIdsArg = defineJobArg<Ref<XoServer['id']>>({
  identify: serverId => serverId.value,
  toArray: true,
})
