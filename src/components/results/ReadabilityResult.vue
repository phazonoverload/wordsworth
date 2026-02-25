<script setup lang="ts">
import type { ReadabilityResult as ReadabilityResultType } from '@/tools/types'
import ReaderContext from '@/components/ReaderContext.vue'

const props = defineProps<{
  result: ReadabilityResultType
}>()

function gradeColor(level: number): string {
  if (level <= 8) return 'bg-green-500'
  if (level <= 12) return 'bg-yellow-500'
  return 'bg-red-500'
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-center gap-3">
      <span
        data-testid="grade-indicator"
        :class="['inline-block h-3 w-3 rounded-full', gradeColor(props.result.gradeLevel)]"
      />
      <span class="text-lg font-semibold">Grade Level {{ props.result.gradeLevel }}</span>
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

    <div class="rounded bg-blue-50 p-3 text-sm text-blue-800">
      {{ props.result.audienceNote }}
    </div>
  </div>
</template>
