<template>
  <VtsSidePanel :has-selection="!!task" @close="emit('close')">
    <template v-if="task && task.status === 'pending'" #actions>
      <UiButton
        v-tooltip="abortRequested && t('task:abort-requested')"
        accent="danger"
        variant="secondary"
        size="medium"
        left-icon="fa:stop"
        :disabled="abortRequested"
        :busy="isAborting"
        @click="abortTask()"
      >
        {{ t('action:abort') }}
      </UiButton>
    </template>
    <template v-if="task">
      <UiAlert v-if="abortError !== undefined" accent="danger">{{ abortError }}</UiAlert>
      <TaskQuickInfosCard :task />
      <TaskInfosCard v-if="task.infos" :task />
      <TaskWarningsCard v-if="task.warnings" :task />
      <TaskErrorsCard v-if="isError" :task />
      <TaskObjectsCard v-if="task.properties.objectId" :task />
      <TaskPropertiesCard v-if="properties.other && Object.keys(properties.other).length > 0" :task />
    </template>
  </VtsSidePanel>
</template>

<script setup lang="ts">
import TaskErrorsCard from '@/modules/task/components/list/panel/cards/TaskErrorsCard.vue'
import TaskInfosCard from '@/modules/task/components/list/panel/cards/TaskInfosCard.vue'
import TaskObjectsCard from '@/modules/task/components/list/panel/cards/TaskObjectsCard.vue'
import TaskPropertiesCard from '@/modules/task/components/list/panel/cards/TaskPropertiesCard.vue'
import TaskQuickInfosCard from '@/modules/task/components/list/panel/cards/TaskQuickInfosCard.vue'
import TaskWarningsCard from '@/modules/task/components/list/panel/cards/TaskWarningsCard.vue'
import { useXoTaskPropertiesUtils } from '@/modules/task/composables/xo-task-properties-utils.composable.ts'
import type { FrontXoTask } from '@/modules/task/remote-resources/use-xo-task-collection.ts'
import { toErrorMessage } from '@/modules/system/utils/system.util.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import VtsSidePanel from '@core/components/panel/VtsSidePanel.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { task } = defineProps<{
  task?: FrontXoTask
}>()

const emit = defineEmits<{
  close: []
}>()

const { t } = useI18n()

const { properties } = useXoTaskPropertiesUtils(() => task)

const isError = computed(() => task && task.result && (task.status === 'failure' || task.status === 'interrupted'))

const isAborting = ref(false)
const abortError = ref<string>()
const abortRequested = computed(() => task?.abortionRequestedAt !== undefined)

watch(
  () => task?.id,
  () => {
    abortError.value = undefined
  }
)

async function abortTask() {
  if (task === undefined) {
    return
  }
  isAborting.value = true
  abortError.value = undefined
  try {
    await fetchPost(`tasks/${task.id}/actions/abort?sync=true`)
  } catch (error) {
    abortError.value = toErrorMessage(error)
  } finally {
    isAborting.value = false
  }
}
</script>
