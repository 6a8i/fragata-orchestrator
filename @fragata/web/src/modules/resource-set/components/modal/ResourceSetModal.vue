<template>
  <UiModal accent="info" icon="fa:layer-group" @confirm="handleConfirm()" @dismiss="emit('cancel')">
    <template #title>
      {{ resourceSet === undefined ? t('action:new-resource-set') : t('action:edit-resource-set') }}
    </template>

    <template #content>
      <div class="resource-set-form">
        <VtsInputWrapper :label="t('name')" :message="nameError">
          <UiInput v-model.trim="name" accent="brand" required />
        </VtsInputWrapper>

        <VtsInputWrapper :label="t('resource-set:subjects')">
          <VtsSelect :id="subjectSelectId" accent="brand" />
        </VtsInputWrapper>

        <VtsInputWrapper :label="t('templates')">
          <VtsSelect :id="templateSelectId" accent="brand" />
        </VtsInputWrapper>
        <VtsInputWrapper :label="t('storage-repositories')">
          <VtsSelect :id="srSelectId" accent="brand" />
        </VtsInputWrapper>
        <VtsInputWrapper :label="t('networks')">
          <VtsSelect :id="networkSelectId" accent="brand" />
        </VtsInputWrapper>

        <div class="quotas">
          <VtsInputWrapper :label="t('vcpus')">
            <UiInput v-model="quotas.cpus" type="number" accent="brand" :placeholder="t('resource-set:no-quota')" />
          </VtsInputWrapper>
          <VtsInputWrapper :label="`${t('ram')} (GiB)`">
            <UiInput
              v-model="quotas.memoryGib"
              type="number"
              accent="brand"
              :placeholder="t('resource-set:no-quota')"
            />
          </VtsInputWrapper>
          <VtsInputWrapper :label="`${t('disk-space')} (GiB)`">
            <UiInput v-model="quotas.diskGib" type="number" accent="brand" :placeholder="t('resource-set:no-quota')" />
          </VtsInputWrapper>
        </div>

        <UiCheckbox v-model="shareByDefault" accent="brand">{{ t('resource-set:share-by-default') }}</UiCheckbox>
      </div>
    </template>

    <template #buttons>
      <VtsOverlayCancelButton @click="emit('cancel')" />
      <VtsOverlayConfirmButton>{{ t('action:save') }}</VtsOverlayConfirmButton>
    </template>
  </UiModal>
</template>

<script lang="ts" setup>
import { useXoGroupCollection } from '@/modules/group/remote-ressources/use-xo-group-collection.ts'
import { useXoNetworkCollection } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import { useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import type { ResourceSetPayload } from '@/modules/resource-set/jobs/xo-resource-set.jobs.ts'
import type { FrontXoResourceSet } from '@/modules/resource-set/remote-resources/use-xo-resource-set-collection.ts'
import { type ResourceSetQuotas, toLimits, toQuotas } from '@/modules/resource-set/utils/resource-set.util.ts'
import { useXoSrCollection } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { useXoUserCollection } from '@/modules/user/remote-resources/use-xo-user-collection.ts'
import { useXoVmTemplateCollection } from '@/modules/vm/remote-resources/use-xo-vm-template-collection.ts'
import type { InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import VtsSelect from '@core/components/select/VtsSelect.vue'
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'
import UiInput from '@core/components/ui/input/UiInput.vue'
import UiModal from '@core/components/ui/modal/UiModal.vue'
import { useFormSelect } from '@core/packages/form-select'
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { resourceSet } = defineProps<{
  resourceSet?: FrontXoResourceSet
}>()

const emit = defineEmits<{
  confirm: [payload: ResourceSetPayload]
  cancel: []
}>()

const { t } = useI18n()

const { users } = useXoUserCollection()
const { groups } = useXoGroupCollection()
const { templates } = useXoVmTemplateCollection()
const { srs } = useXoSrCollection()
const { networks } = useXoNetworkCollection()
const { getPoolById } = useXoPoolCollection()

const objects = new Set(resourceSet?.objects ?? [])

const name = ref(resourceSet?.name ?? '')
const subjectIds = ref<string[]>([...(resourceSet?.subjects ?? [])])
const templateIds = ref<string[]>(templates.value.filter(template => objects.has(template.id)).map(({ id }) => id))
const srIds = ref<string[]>(srs.value.filter(sr => objects.has(sr.id)).map(({ id }) => id))
const networkIds = ref<string[]>(networks.value.filter(network => objects.has(network.id)).map(({ id }) => id))
const quotas = reactive<ResourceSetQuotas>(toQuotas(resourceSet?.limits ?? {}))
const shareByDefault = ref(resourceSet?.shareByDefault ?? false)
const submitted = ref(false)

// objects of the set the collections do not know (another type, a disconnected pool) are kept
const unknownObjects = computed(() => {
  const known = new Set([...templates.value, ...srs.value, ...networks.value].map(({ id }) => id as string))
  return [...objects].filter(id => !known.has(id))
})

const withPool = (label: string, poolId: string) => {
  const pool = getPoolById(poolId as Parameters<typeof getPoolById>[0])
  return pool === undefined ? label : `${label} (${pool.name_label})`
}

const subjects = computed(() => [
  ...users.value.map(user => ({ id: user.id as string, label: `${t('user')}: ${user.name ?? user.email}` })),
  ...groups.value.map(group => ({ id: group.id as string, label: `${t('group')}: ${group.name}` })),
])

const { id: subjectSelectId } = useFormSelect(subjects, {
  model: subjectIds,
  multiple: true,
  searchable: true,
  option: { value: 'id' },
})

const { id: templateSelectId } = useFormSelect(templates, {
  model: templateIds,
  multiple: true,
  searchable: true,
  option: {
    id: template => template.id,
    value: template => template.id as string,
    label: template => withPool(template.name_label, template.$pool),
  },
})

const { id: srSelectId } = useFormSelect(
  computed(() => srs.value.filter(sr => sr.content_type !== 'iso')),
  {
    model: srIds,
    multiple: true,
    searchable: true,
    option: {
      id: sr => sr.id,
      value: sr => sr.id as string,
      label: sr => withPool(sr.name_label, sr.$pool),
    },
  }
)

const { id: networkSelectId } = useFormSelect(networks, {
  model: networkIds,
  multiple: true,
  searchable: true,
  option: {
    id: network => network.id,
    value: network => network.id as string,
    label: network => withPool(network.name_label, network.$pool),
  },
})

const nameError = computed<InputWrapperMessage | undefined>(() =>
  submitted.value && name.value === '' ? { content: t('job:arg:name-required'), accent: 'danger' } : undefined
)

function handleConfirm() {
  submitted.value = true

  if (name.value === '') {
    return
  }

  emit('confirm', {
    name: name.value,
    subjects: [...subjectIds.value],
    objects: [...templateIds.value, ...srIds.value, ...networkIds.value, ...unknownObjects.value],
    limits: toLimits(quotas, resourceSet?.limits),
    shareByDefault: shareByDefault.value,
  })
}
</script>

<style lang="postcss" scoped>
.resource-set-form {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
  text-align: left;

  .quotas {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.6rem;
  }
}
</style>
