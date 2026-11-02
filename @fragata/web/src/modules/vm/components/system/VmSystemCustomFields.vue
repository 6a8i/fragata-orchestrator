<template>
  <UiCard>
    <UiTitle>{{ t('custom-fields') }}</UiTitle>
    <UiAlert v-if="actionError !== undefined" accent="danger">{{ actionError }}</UiAlert>

    <div v-for="[name, value] of fieldEntries" :key="name" class="row">
      <span class="name typo-body-bold">{{ name }}</span>
      <span class="value">{{ value }}</span>
      <UiButtonIcon
        v-tooltip="t('action:edit')"
        icon="action:edit"
        accent="brand"
        size="small"
        @click="edit(name, value)"
      />
      <UiButtonIcon
        v-tooltip="t('action:delete')"
        icon="fa:trash"
        accent="brand"
        size="small"
        :disabled="busy"
        @click="remove(name)"
      />
    </div>
    <VtsStateHero v-if="fieldEntries.length === 0" type="no-data" format="card" horizontal size="extra-small">
      {{ t('custom-fields:none') }}
    </VtsStateHero>

    <div class="form">
      <VtsInputWrapper :label="t('name')">
        <UiInput v-model.trim="newName" accent="brand" />
      </VtsInputWrapper>
      <VtsInputWrapper :label="t('value')">
        <UiInput v-model="newValue" accent="brand" />
      </VtsInputWrapper>
      <UiButton
        accent="brand"
        variant="secondary"
        size="medium"
        left-icon="fa:floppy-disk"
        :disabled="newName === ''"
        :busy="busy"
        @click="save()"
      >
        {{ t('action:save') }}
      </UiButton>
    </div>
  </UiCard>
</template>

<script setup lang="ts">
import { toErrorMessage } from '@/modules/system/utils/system.util.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { fetchDelete, fetchGet, fetchPut } from '@/shared/utils/fetch.util.ts'
import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiInput from '@core/components/ui/input/UiInput.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: FrontXoVm
}>()

const { t } = useI18n()

const fields = ref<Record<string, string>>({})
const newName = ref('')
const newValue = ref('')
const busy = ref(false)
const actionError = ref<string>()

const fieldEntries = computed(() => Object.entries(fields.value).sort(([a], [b]) => a.localeCompare(b)))

const endpoint = (name?: string) =>
  name === undefined ? `vms/${vm.id}/custom_fields` : `vms/${vm.id}/custom_fields/${encodeURIComponent(name)}`

async function load() {
  try {
    fields.value = await fetchGet<Record<string, string>>(endpoint())
  } catch (error) {
    actionError.value = toErrorMessage(error)
  }
}

onMounted(load)
watch(() => vm.id, load)

async function run(action: () => Promise<unknown>) {
  busy.value = true
  actionError.value = undefined
  try {
    await action()
    await load()
    return true
  } catch (error) {
    actionError.value = toErrorMessage(error)
    return false
  } finally {
    busy.value = false
  }
}

function edit(name: string, value: string) {
  newName.value = name
  newValue.value = value
}

async function save() {
  if (await run(() => fetchPut(endpoint(newName.value), { value: newValue.value }))) {
    newName.value = ''
    newValue.value = ''
  }
}

function remove(name: string) {
  return run(() => fetchDelete(endpoint(name)))
}
</script>

<style scoped lang="postcss">
.row {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding-block: 0.4rem;

  .name {
    min-width: 12rem;
  }

  .value {
    flex: 1;
    overflow-wrap: anywhere;
  }
}

.form {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  align-items: end;
  gap: 0.8rem;
}
</style>
