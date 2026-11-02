<template>
  <UiPanelCard>
    <UiPanelCardTitle size="medium" :label="t('privileges')" :counter="privileges.length" />
    <UiAlert v-if="error !== undefined" accent="danger">{{ error }}</UiAlert>

    <div v-for="privilege of sortedPrivileges" :key="privilege.id" class="row">
      <UiInfo :accent="privilege.effect === 'allow' ? 'success' : 'danger'">
        {{ privilege.effect === 'allow' ? t('privileges:allow') : t('privileges:deny') }}
      </UiInfo>
      <span class="label">
        <span class="typo-body-bold">{{ privilege.resource }}</span>
        <span>{{ privilege.action }}</span>
        <code v-if="privilege.selector" class="selector typo-body-regular-small">{{ privilege.selector }}</code>
      </span>
      <UiButtonIcon
        v-if="editable"
        v-tooltip="t('action:remove')"
        accent="danger"
        size="small"
        icon="fa:xmark"
        :busy="busyId === privilege.id"
        @click="remove(privilege.id)"
      />
    </div>

    <div v-if="editable" class="form">
      <VtsSelect :id="resourceSelectId" accent="brand" />
      <VtsSelect :id="actionSelectId" accent="brand" />
      <VtsSelect :id="effectSelectId" accent="brand" />
      <UiInput v-model.trim="selector" accent="brand" :placeholder="t('privileges:selector-placeholder')" />
      <UiButton
        accent="brand"
        variant="primary"
        size="small"
        left-icon="fa:plus"
        :disabled="resource === undefined || action === undefined"
        :busy="busyId === 'add'"
        @click="add()"
      >
        {{ t('action:add') }}
      </UiButton>
    </div>
  </UiPanelCard>
</template>

<script setup lang="ts">
import { toErrorMessage } from '@/modules/system/utils/system.util.ts'
import { fetchDelete, fetchGet, fetchPost } from '@/shared/utils/fetch.util.ts'
import VtsSelect from '@core/components/select/VtsSelect.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiInput from '@core/components/ui/input/UiInput.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useFormSelect } from '@core/packages/form-select'
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

type Privilege = { id: string; resource: string; action: string; effect: 'allow' | 'deny'; selector?: string }

const { roleId, editable } = defineProps<{
  roleId: string
  editable: boolean
}>()

const emit = defineEmits<{
  changed: []
}>()

const { t } = useI18n()

const privileges = ref<Privilege[]>([])
const supportedActions = ref<Record<string, string[]>>({})
const resource = ref<string>()
const action = ref<string>()
const effect = ref<'allow' | 'deny'>('allow')
const selector = ref('')
const busyId = ref<string>()
const error = ref<string>()

const sortedPrivileges = computed(() =>
  [...privileges.value].sort((a, b) => a.resource.localeCompare(b.resource) || a.action.localeCompare(b.action))
)

const resources = computed(() => Object.keys(supportedActions.value).sort())
const actions = computed(() => (resource.value === undefined ? [] : (supportedActions.value[resource.value] ?? [])))
const effects = computed(() => [
  { value: 'allow' as const, label: t('privileges:allow') },
  { value: 'deny' as const, label: t('privileges:deny') },
])

const { id: resourceSelectId } = useFormSelect(resources, {
  model: resource,
  searchable: true,
  placeholder: () => t('privileges:resource'),
})
const { id: actionSelectId } = useFormSelect(actions, {
  model: action,
  searchable: true,
  placeholder: () => t('privileges:action'),
})
const { id: effectSelectId } = useFormSelect(effects, {
  model: effect,
  required: true,
  option: { id: 'value', value: 'value', label: 'label' },
})

watch(resource, () => {
  action.value = undefined
})

async function load() {
  try {
    privileges.value = await fetchGet<Privilege[]>(
      `acl-roles/${roleId}/privileges?fields=id,resource,action,effect,selector`
    )
  } catch (cause) {
    error.value = toErrorMessage(cause)
  }
}

onMounted(async () => {
  await load()
  if (editable) {
    supportedActions.value = await fetchGet<Record<string, string[]>>('acl-privileges/supported_actions').catch(
      () => ({})
    )
  }
})
watch(() => roleId, load)

async function run(id: string, actionToRun: () => Promise<unknown>) {
  busyId.value = id
  error.value = undefined
  try {
    await actionToRun()
    await load()
    emit('changed')
  } catch (cause) {
    error.value = toErrorMessage(cause)
  } finally {
    busyId.value = undefined
  }
}

function add() {
  return run('add', () =>
    fetchPost('acl-privileges', {
      roleId,
      resource: resource.value,
      action: action.value,
      effect: effect.value,
      ...(selector.value === '' ? {} : { selector: selector.value }),
    })
  )
}

function remove(id: string) {
  return run(id, () => fetchDelete(`acl-privileges/${id}`))
}
</script>

<style scoped lang="postcss">
.row {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding-block: 0.4rem;

  .label {
    display: flex;
    flex: 1;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0.4rem 0.8rem;
  }

  .selector {
    color: var(--color-neutral-txt-secondary);
    overflow-wrap: anywhere;
  }
}

.form {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.8rem;
}
</style>
