<template>
  <div class="account-tokens">
    <UiTitle>{{ t('api-tokens') }}</UiTitle>
    <p class="description">{{ t('api-tokens:description') }}</p>
    <UiAlert v-if="error !== undefined" accent="danger">{{ error }}</UiAlert>
    <UiAlert v-if="newToken !== undefined" accent="success">
      {{ t('api-tokens:created') }}
      <code class="token">{{ newToken }}</code>
    </UiAlert>

    <div v-for="token of sortedTokens" :key="token.id" class="row">
      <div class="label">
        <span>{{ token.description || t('api-tokens:no-description') }}</span>
        <span class="sublabel typo-body-regular-small">
          {{ t('api-tokens:expires', { date: new Date(token.expiration).toLocaleString() }) }}
        </span>
      </div>
      <UiButton accent="danger" variant="tertiary" size="small" :busy="busyId === token.id" @click="revoke(token.id)">
        {{ t('action:revoke') }}
      </UiButton>
    </div>
    <VtsStateHero v-if="sortedTokens.length === 0" type="no-data" format="card" horizontal size="extra-small">
      {{ t('api-tokens:none') }}
    </VtsStateHero>

    <div class="form">
      <VtsInputWrapper :label="t('description')">
        <UiInput v-model.trim="description" accent="brand" />
      </VtsInputWrapper>
      <VtsInputWrapper :label="t('api-tokens:validity')">
        <VtsSelect :id="validitySelectId" accent="brand" />
      </VtsInputWrapper>
      <UiButton accent="brand" variant="secondary" size="medium" :busy="busyId === 'new'" @click="create()">
        {{ t('action:create-token') }}
      </UiButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { toErrorMessage } from '@/modules/system/utils/system.util.ts'
import { useXoCurrentUser } from '@/modules/user/remote-resources/use-xo-current-user.ts'
import { fetchDelete, fetchGet, fetchPost } from '@/shared/utils/fetch.util.ts'
import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsSelect from '@core/components/select/VtsSelect.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiInput from '@core/components/ui/input/UiInput.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useFormSelect } from '@core/packages/form-select'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

type Token = { id: string; description?: string; expiration: number }

const { t } = useI18n()

const { currentUser } = useXoCurrentUser()

const tokens = ref<Token[]>([])
const description = ref('')
const validity = ref('30 days')
const newToken = ref<string>()
const busyId = ref<string>()
const error = ref<string>()

const sortedTokens = computed(() => [...tokens.value].sort((a, b) => a.expiration - b.expiration))

const validities = computed(() => [
  { value: '1 day', label: t('api-tokens:1-day') },
  { value: '30 days', label: t('api-tokens:30-days') },
  { value: '1 year', label: t('api-tokens:1-year') },
])

const { id: validitySelectId } = useFormSelect(validities, {
  model: validity,
  required: true,
  option: { id: 'value', value: 'value', label: 'label' },
})

async function load() {
  if (currentUser.value === undefined) {
    return
  }
  try {
    tokens.value = await fetchGet<Token[]>(`users/${currentUser.value.id}/authentication_tokens`)
  } catch (cause) {
    error.value = toErrorMessage(cause)
  }
}

watch(() => currentUser.value?.id, load, { immediate: true })

async function run(id: string, action: () => Promise<void>) {
  busyId.value = id
  error.value = undefined
  try {
    await action()
    await load()
  } catch (cause) {
    error.value = toErrorMessage(cause)
  } finally {
    busyId.value = undefined
  }
}

function create() {
  return run('new', async () => {
    const { token } = await fetchPost<{ token: Token }>(`users/${currentUser.value!.id}/authentication_tokens`, {
      description: description.value === '' ? undefined : description.value,
      expiresIn: validity.value,
    })
    // shown once: the token is a secret
    newToken.value = token.id
    description.value = ''
  })
}

function revoke(tokenId: string) {
  if (tokenId === newToken.value) {
    newToken.value = undefined
  }
  return run(tokenId, () => fetchDelete(`users/${currentUser.value!.id}/authentication_tokens/${tokenId}`))
}
</script>

<style scoped lang="postcss">
.account-tokens {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.description,
.sublabel {
  color: var(--color-neutral-txt-secondary);
}

.token {
  display: block;
  margin-block-start: 0.4rem;
  overflow-wrap: anywhere;
  user-select: all;
}

.row {
  display: flex;
  align-items: center;
  gap: 0.8rem;

  .label {
    display: flex;
    flex: 1;
    flex-direction: column;
  }
}

.form {
  display: grid;
  grid-template-columns: 2fr 1fr auto;
  align-items: end;
  gap: 0.8rem;
}
</style>
