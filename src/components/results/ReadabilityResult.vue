<script setup lang="ts">
import { ref, watch } from 'vue'
import type { ReadabilityResult as ReadabilityResultType } from '@/tools/types'
import ReaderContext from '@/components/ReaderContext.vue'
import { useSettingsStore } from '@/stores/settings'
import { useDocumentStore } from '@/stores/document'
import { assessAudience } from '@/tools/audience-assessment'

const props = defineProps<{
  result: ReadabilityResultType
}>()

const settingsStore = useSettingsStore()
const documentStore = useDocumentStore()

const assessment = ref<string | null>(null)
const isAssessing = ref(false)
const error = ref<string | null>(null)

function gradeColor(level: number): string {
  if (level <= 8) return 'bg-green-500'
  if (level <= 12) return 'bg-yellow-500'
  return 'bg-red-500'
}

function gradeDescription(grade: number): string {
  if (grade <= 5) return 'elementary school'
  if (grade <= 8) return 'middle school'
  if (grade <= 12) return 'high school'
  if (grade <= 16) return 'college'
  return 'graduate/professional'
}

async function runAssessment() {
  isAssessing.value = true
  error.value = null
  try {
    assessment.value = await assessAudience(
      documentStore.content,
      documentStore.readerContext.description
    )
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Assessment failed'
  } finally {
    isAssessing.value = false
  }
}

watch(() => documentStore.readerContext.description, () => {
  assessment.value = null
  error.value = null
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-center gap-3">
      <span
        data-testid="grade-indicator"
        :class="['inline-block h-3 w-3 rounded-full', gradeColor(props.result.gradeLevel)]"
      />
      <span class="text-lg font-semibold">Grade Level {{ props.result.gradeLevel }}</span>
      <span class="text-sm text-gray-500">{{ gradeDescription(props.result.gradeLevel) }}</span>
    </div>

    <div class="grid grid-cols-2 gap-3 text-sm">
      <div class="rounded bg-gray-50 p-3">
        <div class="text-xs text-gray-500">Flesch-Kincaid</div>
        <div class="text-lg font-medium">{{ props.result.fleschKincaid }}</div>
      </div>
      <div class="rounded bg-gray-50 p-3">
        <div class="text-xs text-gray-500">Gunning Fog</div>
        <div class="text-lg font-medium">{{ props.result.gunningFog }}</div>
      </div>
      <div class="rounded bg-gray-50 p-3">
        <div class="text-xs text-gray-500">Words</div>
        <div class="text-lg font-medium">{{ props.result.wordCount }}</div>
      </div>
      <div class="rounded bg-gray-50 p-3">
        <div class="text-xs text-gray-500">Sentences</div>
        <div class="text-lg font-medium">{{ props.result.sentenceCount }}</div>
      </div>
      <div class="rounded bg-gray-50 p-3">
        <div class="text-xs text-gray-500">Reading Time</div>
        <div class="text-lg font-medium">{{ props.result.readingTimeMinutes }} min</div>
      </div>
    </div>

    <ReaderContext />

    <button
      v-if="settingsStore.hasKeyForCurrentProvider && !assessment && !isAssessing"
      class="bg-orange-500 hover:bg-orange-600 text-white rounded px-3 py-1.5 text-sm font-medium"
      @click="runAssessment"
    >
      Assess for audience
    </button>

    <div v-if="isAssessing" class="text-sm text-gray-500">
      Assessing...
    </div>

    <div v-if="assessment" class="rounded bg-orange-50 p-3 text-sm text-orange-800">
      {{ assessment }}
    </div>

    <div v-if="error" class="rounded bg-red-50 p-3 text-sm text-red-700">
      {{ error }}
    </div>
  </div>
</template>
