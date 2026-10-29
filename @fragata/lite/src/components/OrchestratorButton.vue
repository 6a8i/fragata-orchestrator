<template>
  <UiButton
    v-if="orchestratorFound"
    size="medium"
    accent="brand"
    variant="primary"
    left-icon="fa:arrow-up-right-from-square"
    class="orchestrator-button"
    @click="openOrchestrator()"
  >
    {{ t('access-xoa') }}
  </UiButton>
</template>

<script lang="ts" setup>
import type { PRIMARY_ADDRESS_TYPE } from '@/libs/xen-api/xen-api.enums.ts'
import { usePoolStore } from '@/stores/xen-api/pool.store.ts'
import UiButton from '@core/components/ui/button/UiButton.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

// A Fragata orchestrator that manages this pool leaves its address in the
// pool's `other_config` (see `poolMarkingPrefix` in the server config). When
// one is found, offer to open it; nothing is offered otherwise.

const { t } = useI18n()

const { pool } = usePoolStore().subscribe()
const CLIENT_INFO_KEY_PREFIX = 'xo:clientInfo:'

interface InterfaceInfo {
  address: string
  netmask: string
  mac: string
  cidr: string
  family: PRIMARY_ADDRESS_TYPE
  internal: boolean
}

interface ClientInfo {
  lastConnected: number
  networkInterfaces?: Record<string, InterfaceInfo[]>
  publicUrl?: string
}

const clientsInfo = computed(() => {
  if (pool.value === undefined) {
    return
  }

  return Object.fromEntries(
    Object.entries(pool.value.other_config)
      .filter(([key]) => key.startsWith(CLIENT_INFO_KEY_PREFIX))
      .map(([key, json]) => [key.slice(CLIENT_INFO_KEY_PREFIX.length), JSON.parse(json)])
  ) as Record<string, ClientInfo>
})

const latestClientInfo = computed(() => {
  if (clientsInfo.value === undefined) {
    return
  }

  return Object.values(clientsInfo.value).reduce<ClientInfo | undefined>(
    (latest, info) => (latest === undefined || info.lastConnected > latest.lastConnected ? info : latest),
    undefined
  )
})

const orchestratorAddress = computed(() => {
  if (latestClientInfo.value === undefined) {
    return
  }

  const { networkInterfaces, publicUrl } = latestClientInfo.value

  if (publicUrl !== undefined) {
    return publicUrl
  }

  if (networkInterfaces === undefined || Object.keys(networkInterfaces).length === 0) {
    return
  }

  const ifName = 'eth0' in networkInterfaces ? 'eth0' : Object.keys(networkInterfaces)[0]
  const address = networkInterfaces[ifName][0].address

  return `https://${address}`
})

const orchestratorFound = computed(() => orchestratorAddress.value !== undefined)

const openOrchestrator = () => window.open(orchestratorAddress.value, '_blank', 'noopener')
</script>
