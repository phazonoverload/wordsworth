<script setup lang="ts">
import type { HedgeWordResult as HedgeWordResultType, HedgeMatch, HedgeWordCounts } from '@/tools/types'
import { useToolStore } from '@/stores/tools'
import { watch, computed } from 'vue'

const props = defineProps<{
  result: HedgeWordResultType
}>()

const toolStore = useToolStore()

const visibleMatches = computed(() => props.result.matches.filter(m => !m.dismissed))
const dismissedCount = computed(() => props.result.matches.length - visibleMatches.value.length)

const hedgeGroups: { key: keyof HedgeWordCounts; label: string; words: string; bgClass: string; barClass: string; borderClass: string }[] = [
  { key: 'uncertainty', label: 'Uncertainty', words: 'might, could, may, perhaps, possibly...', bgClass: 'bg-orange-50', barClass: 'bg-orange-400', borderClass: 'border-orange-200' },
  { key: 'frequency', label: 'Frequency', words: 'generally, usually, often, sometimes...', bgClass: 'bg-amber-50', barClass: 'bg-amber-400', borderClass: 'border-amber-200' },
  { key: 'softener', label: 'Softeners', words: 'somewhat, fairly, rather, quite...', bgClass: 'bg-rose-50', barClass: 'bg-rose-400', borderClass: 'border-rose-200' },
]

function onMatchClick(match: HedgeMatch) {
  toolStore.setHighlightRange({ from: match.from, to: match.to })
}

function onDismiss(match: HedgeMatch) {
  match.dismissed = true
}

watch(() => props.result.matches, (matches) => {
  if (matches.length > 0) {
    toolStore.setHedgeHighlights(matches)
  } else {
    toolStore.clearHedgeHighlights()
  }
}, { immediate: true })
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="rounded bg-orange-50 p-3 text-sm text-orange-800">
      {{ props.result.toneAssessment }}
    </div>

    <div v-if="props.result.total === 0" class="text-sm text-gray-500">
      No hedge words detected in {{ props.result.wordCount }} words.
    </div>

    <template v-else>
      <div class="flex items-center gap-3 text-sm text-gray-700">
        <span>Hedge words: <span class="font-medium">{{ props.result.total }}</span></span>
        <span>Density: <span class="font-medium">{{ props.result.density.toFixed(1) }}%</span></span>
      </div>

      <div class="flex flex-col gap-3">
        <div
          v-for="group in hedgeGroups"
          :key="group.key"
          data-testid="hedge-card"
          :class="['rounded-lg border p-3', group.bgClass, group.borderClass]"
        >
          <div class="mb-2 flex items-center justify-between">
            <div>
              <span class="text-sm font-medium text-gray-800">{{ group.label }}</span>
              <span class="ml-2 text-xs text-gray-500">{{ group.words }}</span>
            </div>
            <span class="text-sm font-semibold text-gray-700">{{ props.result.counts[group.key] }}</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="relative h-3 flex-1 rounded-full bg-white/60">
              <div
                data-testid="hedge-bar"
                :class="['h-3 rounded-full', group.barClass]"
                :style="{ width: `${props.result.percentages[group.key]}%` }"
              />
            </div>
            <span class="w-10 text-right text-xs font-medium text-gray-600">{{ props.result.percentages[group.key] }}%</span>
          </div>
        </div>
      </div>

      <div class="flex flex-col gap-1">
        <div class="flex items-center justify-between text-sm text-gray-700">
          <span class="font-medium">Matches</span>
          <span v-if="dismissedCount > 0" class="text-gray-400" data-testid="dismissed-count">
            ({{ dismissedCount }} dismissed)
          </span>
        </div>
        <div class="flex flex-col gap-1.5">
          <div
            v-for="(match, idx) in visibleMatches"
            :key="`${match.from}-${idx}`"
            data-testid="hedge-match"
            class="rounded border border-gray-200 text-sm transition-colors"
          >
            <div
              class="flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-gray-50 transition-colors"
              @click="onMatchClick(match)"
            >
              <span class="font-medium text-gray-800">{{ match.word }}</span>
              <span class="text-xs text-gray-400">Line {{ match.line }}</span>
            </div>
            <div class="border-t border-gray-100 px-3 py-1">
              <button
                data-testid="dismiss-btn"
                class="text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
                @click.stop="onDismiss(match)"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
