<script setup lang="ts">
import { watch } from 'vue'
import type { PronounResult as PronounResultType, PronounCounts } from '@/tools/types'
import { useToolStore } from '@/stores/tools'

const props = defineProps<{
  result: PronounResultType
}>()

const toolStore = useToolStore()

const pronounGroups: { key: keyof PronounCounts; label: string; color: string; bgClass: string; barClass: string; borderClass: string }[] = [
  { key: 'i', label: 'I / me / my / mine', color: 'blue', bgClass: 'bg-blue-50', barClass: 'bg-blue-400', borderClass: 'border-blue-200' },
  { key: 'you', label: 'you / your / yours', color: 'green', bgClass: 'bg-green-50', barClass: 'bg-green-400', borderClass: 'border-green-200' },
  { key: 'we', label: 'we / us / our / ours', color: 'amber', bgClass: 'bg-amber-50', barClass: 'bg-amber-400', borderClass: 'border-amber-200' },
]

watch(() => props.result.matches, (matches) => {
  if (matches.length > 0) {
    toolStore.setPronounHighlights(matches)
  } else {
    toolStore.clearPronounHighlights()
  }
}, { immediate: true })
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="rounded bg-orange-50 p-3 text-sm text-orange-800">
      {{ props.result.toneAssessment }}
    </div>

    <div class="text-sm text-gray-700">
      Total pronouns: <span class="font-medium">{{ props.result.total }}</span>
    </div>

    <div class="flex flex-col gap-3">
      <div
        v-for="group in pronounGroups"
        :key="group.key"
        data-testid="pronoun-card"
        :class="['rounded-lg border p-3', group.bgClass, group.borderClass]"
      >
        <div class="mb-2 flex items-center justify-between">
          <span class="text-sm font-medium text-gray-800">{{ group.label }}</span>
          <span class="text-sm font-semibold text-gray-700">{{ props.result.counts[group.key] }}</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="relative h-3 flex-1 rounded-full bg-white/60">
            <div
              data-testid="pronoun-bar"
              :class="['h-3 rounded-full', group.barClass]"
              :style="{ width: `${props.result.percentages[group.key]}%` }"
            />
          </div>
          <span class="w-10 text-right text-xs font-medium text-gray-600">{{ props.result.percentages[group.key] }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>
