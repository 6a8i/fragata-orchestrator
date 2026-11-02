<template>
  <UiCard>
    <UiTitle>{{ t('docker') }}</UiTitle>
    <p class="description">{{ t('docker:description') }}</p>
    <UiAlert v-if="actionError !== undefined" accent="danger">{{ actionError }}</UiAlert>

    <template v-if="docker?.enabled">
      <div v-if="docker.version !== undefined" class="sublabel typo-body-regular-small">
        {{ t('docker:version', { version: docker.version }) }}
      </div>
      <div v-for="container of docker.containers ?? []" :key="container" class="row">
        <span class="label">{{ container }}</span>
        <UiButton
          v-for="action of CONTAINER_ACTIONS"
          :key="action"
          accent="brand"
          variant="tertiary"
          size="small"
          :disabled="busy !== undefined"
          :busy="busy === `${container}:${action}`"
          @click="runContainerAction(container, action)"
        >
          {{ actionLabels[action] }}
        </UiButton>
      </div>
      <VtsStateHero
        v-if="(docker.containers ?? []).length === 0"
        type="no-data"
        format="card"
        horizontal
        size="extra-small"
      >
        {{ t('docker:no-container') }}
      </VtsStateHero>
    </template>

    <div>
      <UiButton
        v-if="docker?.enabled"
        accent="danger"
        variant="secondary"
        size="small"
        :busy="busy === 'deregister'"
        @click="run('deregister', () => fetchPost(`vms/${vm.id}/actions/docker_deregister`))"
      >
        {{ t('action:docker-deregister') }}
      </UiButton>
      <UiButton
        v-else
        accent="brand"
        variant="secondary"
        size="small"
        :busy="busy === 'register'"
        @click="run('register', () => fetchPost(`vms/${vm.id}/actions/docker_register`))"
      >
        {{ t('action:docker-register') }}
      </UiButton>
    </div>
  </UiCard>
</template>

<script setup lang="ts">
import { toErrorMessage } from '@/modules/system/utils/system.util.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { fetchGet, fetchPost } from '@/shared/utils/fetch.util.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import type { XoVm } from '@fragata/types'
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: FrontXoVm
}>()

const CONTAINER_ACTIONS = ['start', 'stop', 'restart', 'pause', 'unpause'] as const

const { t } = useI18n()

const actionLabels = computed(() => ({
  start: t('action:start'),
  stop: t('action:stop'),
  restart: t('action:restart'),
  pause: t('action:pause'),
  unpause: t('action:unpause'),
}))

const docker = ref<XoVm['docker']>()
const busy = ref<string>()
const actionError = ref<string>()

async function load() {
  try {
    docker.value = (await fetchGet<Pick<XoVm, 'docker'>>(`vms/${vm.id}?fields=docker`)).docker
  } catch (error) {
    actionError.value = toErrorMessage(error)
  }
}

onMounted(load)
watch(() => vm.id, load)

async function run(id: string, action: () => Promise<unknown>) {
  busy.value = id
  actionError.value = undefined
  try {
    await action()
    await load()
  } catch (error) {
    actionError.value = toErrorMessage(error)
  } finally {
    busy.value = undefined
  }
}

function runContainerAction(container: string, action: (typeof CONTAINER_ACTIONS)[number]) {
  return run(`${container}:${action}`, () =>
    fetchPost(`vms/${vm.id}/docker_containers/${encodeURIComponent(container)}/actions/${action}`)
  )
}
</script>

<style scoped lang="postcss">
.description,
.sublabel {
  color: var(--color-neutral-txt-secondary);
}

.row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
  padding-block: 0.4rem;

  .label {
    flex: 1;
    overflow-wrap: anywhere;
  }
}
</style>
