<template>
  <UiDrawer @confirm="handleConfirm()" @dismiss="emit('cancel')">
    <template #title>
      {{ user === undefined ? t('action:new-user') : t('action:edit-user') }}
    </template>

    <template #content>
      <div class="user-drawer">
        <VtsInputWrapper :label="t('user-form:login')" :message="nameError">
          <UiInput v-model.trim="name" accent="brand" required placeholder="jane@example.com" />
        </VtsInputWrapper>

        <VtsInputWrapper
          :label="t('password')"
          :message="passwordError ?? (user !== undefined ? t('user-form:password-keep-hint') : undefined)"
        >
          <UiInput v-model="password" type="password" accent="brand" :required="user === undefined" />
        </VtsInputWrapper>

        <VtsInputWrapper :label="t('user-form:permission')">
          <VtsSelect :id="permissionSelectId" accent="brand" />
        </VtsInputWrapper>

        <UiAlert accent="info">{{ t('user-form:permission-hint') }}</UiAlert>
      </div>
    </template>

    <template #buttons>
      <VtsOverlayCancelButton @click="emit('cancel')" />
      <VtsOverlayConfirmButton>
        {{ user === undefined ? t('action:create') : t('action:save') }}
      </VtsOverlayConfirmButton>
    </template>
  </UiDrawer>
</template>

<script lang="ts" setup>
import type { UserPayload } from '@/modules/user/jobs/xo-user.jobs.ts'
import type { FrontXoUser } from '@/modules/user/remote-resources/use-xo-user-collection.ts'
import type { InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import VtsSelect from '@core/components/select/VtsSelect.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiDrawer from '@core/components/ui/drawer/UiDrawer.vue'
import UiInput from '@core/components/ui/input/UiInput.vue'
import { useFormSelect } from '@core/packages/form-select'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { user } = defineProps<{
  // when set, the drawer edits this user instead of creating one
  user?: FrontXoUser
}>()

const emit = defineEmits<{
  confirm: [payload: UserPayload]
  cancel: []
}>()

const { t } = useI18n()

const name = ref(user?.name ?? user?.email ?? '')
const password = ref('')
const permission = ref<UserPayload['permission']>(user?.permission === 'admin' ? 'admin' : 'none')
const submitted = ref(false)

const permissionOptions = computed(() => [
  { id: 'none', label: t('user-form:permission-user'), value: 'none' as const },
  { id: 'admin', label: t('user-form:permission-admin'), value: 'admin' as const },
])

const { id: permissionSelectId } = useFormSelect(permissionOptions, {
  model: permission,
  required: true,
  option: { label: 'label', value: 'value' },
})

const nameError = computed<InputWrapperMessage | undefined>(() =>
  submitted.value && name.value === '' ? { content: t('field-required'), accent: 'danger' } : undefined
)

const passwordError = computed<InputWrapperMessage | undefined>(() =>
  submitted.value && user === undefined && password.value === ''
    ? { content: t('field-required'), accent: 'danger' }
    : undefined
)

function handleConfirm() {
  submitted.value = true

  if (nameError.value !== undefined || passwordError.value !== undefined) {
    return
  }

  emit('confirm', {
    name: name.value,
    permission: permission.value,
    ...(password.value !== '' && { password: password.value }),
  })
}
</script>

<style lang="postcss" scoped>
.user-drawer {
  display: flex;
  flex-direction: column;
  gap: 2.4rem;
  margin-block-start: 1.6rem;
  text-align: left;
}
</style>
