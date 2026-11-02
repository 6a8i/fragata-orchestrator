<template>
  <UiDrawer @confirm="handleConfirm()" @dismiss="emit('cancel')">
    <template #title>
      {{ t('action:edit-settings') }}
    </template>

    <template #content>
      <div class="host-settings-drawer">
        <div class="section">
          <UiTitle>{{ t('general-information') }}</UiTitle>
          <VtsInputWrapper :label="t('name')" :message="nameError">
            <UiInput v-model.trim="formData.nameLabel" accent="brand" required />
          </VtsInputWrapper>
          <VtsInputWrapper :label="t('description')">
            <UiInput v-model.trim="formData.nameDescription" accent="brand" />
          </VtsInputWrapper>
          <VtsInputWrapper :label="t('remote-syslog')" :message="{ content: t('remote-syslog-hint'), accent: 'info' }">
            <UiInput v-model.trim="formData.syslogDestination" accent="brand" placeholder="logs.example.org:514" />
          </VtsInputWrapper>
        </div>

        <div class="section">
          <UiTitle>{{ t('storage') }}</UiTitle>
          <VtsInputWrapper :label="t('iscsi-iqn')">
            <UiInput v-model.trim="formData.iscsiIqn" accent="brand" />
          </VtsInputWrapper>
          <UiCheckbox v-model="formData.multipathing" accent="brand">{{ t('multipathing') }}</UiCheckbox>
          <UiAlert v-if="formData.multipathing !== host.multipathing" accent="warning">
            {{ t('host-settings:multipathing-warning') }}
          </UiAlert>
        </div>
      </div>
    </template>

    <template #buttons>
      <VtsOverlayCancelButton @click="emit('cancel')" />
      <VtsOverlayConfirmButton>{{ t('action:save') }}</VtsOverlayConfirmButton>
    </template>
  </UiDrawer>
</template>

<script lang="ts" setup>
import type { EditHostPayload } from '@/modules/host/jobs/xo-host-admin.jobs.ts'
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'
import UiDrawer from '@core/components/ui/drawer/UiDrawer.vue'
import UiInput from '@core/components/ui/input/UiInput.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { host } = defineProps<{
  host: FrontXoHost
}>()

const emit = defineEmits<{
  confirm: [payload: EditHostPayload]
  cancel: []
}>()

const { t } = useI18n()

const initialSyslog = host.logging?.syslog_destination ?? ''

const formData = reactive({
  nameLabel: host.name_label,
  nameDescription: host.name_description,
  iscsiIqn: host.iscsiIqn ?? '',
  multipathing: host.multipathing,
  syslogDestination: initialSyslog,
})

const submitted = ref(false)

const nameError = computed<InputWrapperMessage | undefined>(() =>
  submitted.value && formData.nameLabel === '' ? { content: t('job:arg:name-required'), accent: 'danger' } : undefined
)

function handleConfirm() {
  submitted.value = true

  if (formData.nameLabel === '') {
    return
  }

  const payload: EditHostPayload = {}

  if (formData.nameLabel !== host.name_label) payload.nameLabel = formData.nameLabel
  if (formData.nameDescription !== host.name_description) payload.nameDescription = formData.nameDescription
  if (formData.iscsiIqn !== (host.iscsiIqn ?? '')) payload.iscsiIqn = formData.iscsiIqn
  if (formData.multipathing !== host.multipathing) payload.multipathing = formData.multipathing
  if (formData.syslogDestination !== initialSyslog) {
    payload.syslogDestination = formData.syslogDestination === '' ? null : formData.syslogDestination
  }

  emit('confirm', payload)
}
</script>

<style lang="postcss" scoped>
.host-settings-drawer {
  display: flex;
  flex-direction: column;
  gap: 3.2rem;
  margin-block-start: 1.6rem;
  text-align: left;

  .section {
    display: flex;
    flex-direction: column;
    gap: 1.6rem;
  }
}
</style>
