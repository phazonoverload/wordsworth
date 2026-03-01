<script setup lang="ts">
import type { AcronymCheckerResult as AcronymCheckerResultType, AcronymIssue } from '@/tools/types'
import { useToolStore } from '@/stores/tools'
import { ref, computed } from 'vue'

const props = defineProps<{
  result: AcronymCheckerResultType
}>()

const toolStore = useToolStore()
const showHeuristics = ref(false)

const visibleAcronyms = computed(() => props.result.acronyms.filter(a => !a.dismissed))
const dismissedCount = computed(() => props.result.acronyms.length - visibleAcronyms.value.length)

function onIssueClick(issue: AcronymIssue) {
  toolStore.setHighlightRange({ from: issue.absoluteOffset, to: issue.absoluteOffset + issue.length })
}

function onDismiss(issue: AcronymIssue) {
  issue.dismissed = true
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div v-if="props.result.allExpanded" class="text-sm text-gray-500">
      All {{ props.result.totalAcronymsFound }} acronym{{ props.result.totalAcronymsFound === 1 ? '' : 's' }} are properly expanded on first use
    </div>

    <template v-else>
      <div class="text-sm font-medium text-gray-700" data-testid="issue-summary">
        <template v-if="visibleAcronyms.length > 0">
          {{ visibleAcronyms.length }} unexpanded acronym{{ visibleAcronyms.length === 1 ? '' : 's' }}
          out of {{ props.result.totalAcronymsFound }} total
        </template>
        <template v-else>
          All issues dismissed
        </template>
        <span v-if="dismissedCount > 0" class="ml-1 text-gray-400" data-testid="dismissed-count">
          ({{ dismissedCount }} dismissed)
        </span>
      </div>

      <div class="flex flex-col gap-2">
        <div
          v-for="issue in visibleAcronyms"
          :key="issue.acronym"
          data-testid="acronym-issue"
          class="rounded border border-gray-200 text-sm transition-colors"
        >
          <div
            class="p-3 cursor-pointer hover:bg-violet-50 transition-colors"
            @click="onIssueClick(issue)"
          >
            <div class="mb-1 flex items-center gap-2">
              <span
                data-testid="acronym-badge"
                class="rounded bg-violet-100 px-2 py-0.5 text-xs font-bold text-violet-800"
              >
                {{ issue.acronym }}
              </span>
              <span class="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                {{ issue.count }} use{{ issue.count === 1 ? '' : 's' }}
              </span>
              <span class="text-xs text-gray-400">Line {{ issue.line }}</span>
            </div>
            <div class="text-gray-800">
              "{{ issue.acronym }}" is not expanded on first use. Consider introducing it as "Full Phrase ({{ issue.acronym }})" on first mention.
            </div>
          </div>
          <div class="border-t border-gray-100 px-3 py-1.5">
            <button
              data-testid="dismiss-btn"
              class="text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
              @click.stop="onDismiss(issue)"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </template>

    <div class="border-t border-gray-100 pt-3">
      <button
        data-testid="heuristics-toggle"
        class="text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
        @click="showHeuristics = !showHeuristics"
      >
        {{ showHeuristics ? 'Hide' : 'Show' }} detection details
      </button>
      <div v-if="showHeuristics" data-testid="heuristics-panel" class="mt-2 rounded bg-gray-50 p-3 text-xs text-gray-600 leading-relaxed">
        <p class="font-medium text-gray-700 mb-1">How this check works</p>
        <ul class="list-disc pl-4 flex flex-col gap-1">
          <li><strong>Acronym detection:</strong> Sequences of 2 or more uppercase letters (e.g. API, HTML, NASA) are identified as acronyms.</li>
          <li><strong>Code blocks ignored:</strong> Text inside fenced code blocks and inline code is excluded from analysis.</li>
          <li><strong>Expansion patterns recognized:</strong></li>
          <ul class="list-disc pl-4 mt-0.5">
            <li>"Full Phrase (ACRONYM)" &mdash; parenthetical definition</li>
            <li>"ACRONYM (Full Phrase)" &mdash; reverse parenthetical</li>
            <li>"ACRONYM, or Full Phrase" &mdash; inline definition</li>
          </ul>
          <li><strong>Common abbreviations skipped:</strong> Well-known terms like OK, US, AM, PM, ID, and TV are not flagged.</li>
        </ul>
      </div>
    </div>
  </div>
</template>
