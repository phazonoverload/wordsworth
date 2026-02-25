<script setup lang="ts">
import type { StyleCheckResult as StyleCheckResultType, StyleIssue } from '@/tools/types'
import { useToolStore } from '@/stores/tools'

const props = defineProps<{
  result: StyleCheckResultType
}>()

const toolStore = useToolStore()

function severityClasses(severity: 'warning' | 'info'): string {
  return severity === 'warning'
    ? 'bg-yellow-100 text-yellow-800'
    : 'bg-blue-100 text-blue-800'
}

function onIssueClick(issue: StyleIssue) {
  toolStore.setHighlightRange({ from: issue.offset, to: issue.offset + issue.length })
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div v-if="props.result.issues.length === 0" class="text-sm text-gray-500">
      No issues found
    </div>

    <template v-else>
      <div class="text-sm font-medium text-gray-700">
        {{ props.result.issues.length }} issue{{ props.result.issues.length === 1 ? '' : 's' }} found
      </div>

      <div class="flex flex-col gap-2">
        <div
          v-for="issue in props.result.issues"
          :key="`${issue.line}-${issue.offset}`"
          data-testid="style-issue"
          class="cursor-pointer rounded border border-gray-200 p-3 text-sm transition-colors hover:border-blue-300 hover:bg-blue-50"
          @click="onIssueClick(issue)"
        >
          <div class="mb-1 flex items-center gap-2">
            <span
              data-testid="severity-badge"
              :class="['rounded px-2 py-0.5 text-xs font-medium', severityClasses(issue.severity)]"
            >
              {{ issue.severity }}
            </span>
            <span class="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
              {{ issue.category }}
            </span>
            <span class="text-xs text-gray-400">Line {{ issue.line }}</span>
          </div>
          <div class="text-gray-800">{{ issue.message }}</div>
          <div v-if="issue.suggestion" class="mt-1 text-xs text-gray-500">
            Suggestion: {{ issue.suggestion }}
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
