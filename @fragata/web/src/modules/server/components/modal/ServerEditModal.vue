<template>
  <UiModal accent="info" icon="fa:server" @confirm="handleConfirm()" @dismiss="emit('cancel')">
    <template #title>{{ t('action:edit-connection') }}</template>

    <template #content>
      <div class="server-edit-form">
        <VtsInputWrapper :label="t('label')">
          <UiInput v-model.trim="label" accent="brand" />
        </VtsInputWrapper>
        <VtsInputWrapper :label="t('ip-address')" :message="t('server:reconnect-info')">
          <UiInput v-model.trim="host" accent="brand" required />
        </VtsInputWrapper>
        <VtsInputWrapper :label="t('username')">
          <UiInput v-model.trim="username" accent="brand" />
        </VtsInputWrapper>
        <VtsInputWrapper :label="t('password')" :message="t('server:password-unchanged-info')">
          <UiInput v-model="password" type="password" accent="brand" />
        </VtsInputWrapper>
        <VtsInputWrapper :label="t('http-proxy')">
          <UiInput v-model.trim="httpProxy" accent="brand" />
        </VtsInputWrapper>
        <UiCheckbox v-model="allowUnauthorized" accent="brand">{{ t('server:allow-unauthorized') }}</UiCheckbox>
        <UiCheckbox v-model="readOnly" accent="brand">{{ t('read-only') }}</UiCheckbox>
      </div>
    </template>

    <template #buttons>
      <VtsOverlayCancelButton @click="emit('cancel')" />
      <VtsOverlayConfirmButton>{{ t('action:save') }}</VtsOverlayConfirmButton>
    </template>
  </UiModal>
</template>

<script lang="ts" setup>
import type { FrontXoServer } from '@/modules/server/remote-resources/use-xo-server-collection.ts'
import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'
import UiInput from '@core/components/ui/input/UiInput.vue'
import UiModal from '@core/components/ui/modal/UiModal.vue'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

export type ServerEditPayload = {
  label: string | null
  host: string
  username: string
  password?: string
  httpProxy: string | null
  allowUnauthorized: boolean
  readOnly: boolean
}

const { server } = defineProps<{
  server: FrontXoServer
}>()

const emit = defineEmits<{
  confirm: [payload: Partial<ServerEditPayload>]
  cancel: []
}>()

const { t } = useI18n()

const label = ref(server.label ?? '')
const host = ref(server.host)
const username = ref(server.username)
const password = ref('')
const httpProxy = ref(server.httpProxy ?? '')
const allowUnauthorized = ref(server.allowUnauthorized ?? false)
const readOnly = ref(server.readOnly ?? false)

function handleConfirm() {
  if (host.value === '') {
    return
  }

  // only the changed properties: a change of address, credentials or proxy reconnects the server
  const payload: Partial<ServerEditPayload> = {}
  if (label.value !== (server.label ?? '')) {
    payload.label = label.value === '' ? null : label.value
  }
  if (host.value !== server.host) {
    payload.host = host.value
  }
  if (username.value !== server.username) {
    payload.username = username.value
  }
  if (password.value !== '') {
    payload.password = password.value
  }
  if (httpProxy.value !== (server.httpProxy ?? '')) {
    payload.httpProxy = httpProxy.value === '' ? null : httpProxy.value
  }
  if (allowUnauthorized.value !== (server.allowUnauthorized ?? false)) {
    payload.allowUnauthorized = allowUnauthorized.value
  }
  if (readOnly.value !== (server.readOnly ?? false)) {
    payload.readOnly = readOnly.value
  }

  emit('confirm', payload)
}
</script>

<style lang="postcss" scoped>
.server-edit-form {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
  text-align: left;
}
</style>
