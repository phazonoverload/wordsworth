<script setup lang="ts">
import type { PronounResult as PronounResultType, PronounCounts } from '@/tools/types'

const props = defineProps<{
  result: PronounResultType
}>()

const pronounLabels: (keyof PronounCounts)[] = ['we', 'i', 'you', 'they', 'he', 'she', 'it']
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="rounded bg-blue-50 p-3 text-sm text-blue-800">
      {{ props.result.toneAssessment }}
    </div>

    <div class="text-sm text-gray-700">
      Total pronouns: <span class="font-medium">{{ props.result.total }}</span>
    </div>

    <div class="flex flex-col gap-2">
      <div
        v-for="pronoun in pronounLabels"
        :key="pronoun"
        class="flex items-center gap-3 text-sm"
      >
        <span class="w-10 font-medium text-gray-700">{{ pronoun }}</span>
        <span class="w-8 text-right text-gray-500">{{ props.result.counts[pronoun] }}</span>
        <div class="relative h-4 flex-1 rounded bg-gray-100">
          <div
            data-testid="pronoun-bar"
            class="h-4 rounded bg-blue-400"
            :style="{ width: `${props.result.percentages[pronoun]}%` }"
          />
        </div>
        <span class="w-10 text-right text-xs text-gray-500">{{ props.result.percentages[pronoun] }}%</span>
      </div>
    </div>
  </div>
</template>
