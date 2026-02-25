<script setup lang="ts">
import type { StyleCheckResult as StyleCheckResultType, StyleIssue } from '@/tools/types'
import { useToolStore } from '@/stores/tools'
import { useDocumentStore } from '@/stores/document'
import { useSettingsStore } from '@/stores/settings'
import { fixSingleIssue, fixAllIssues } from '@/tools/style-fix'
import { ref, computed } from 'vue'

const props = defineProps<{
  result: StyleCheckResultType
}>()

const toolStore = useToolStore()
const documentStore = useDocumentStore()
const settingsStore = useSettingsStore()

const fixingIssueKey = ref<string | null>(null)
const fixingAll = ref(false)
const isMergeActive = computed(() => !!(toolStore.mergeOriginal && toolStore.mergeModified))
const isFixing = computed(() => fixingIssueKey.value !== null || fixingAll.value)

function severityClasses(severity: 'warning' | 'info'): string {
  return severity === 'warning'
    ? 'bg-yellow-100 text-yellow-800'
    : 'bg-blue-100 text-blue-800'
}

function issueKey(issue: StyleIssue): string {
  return `${issue.line}-${issue.offset}`
}

function onIssueClick(issue: StyleIssue) {
  if (isMergeActive.value) return
  toolStore.setHighlightRange({ from: issue.absoluteOffset, to: issue.absoluteOffset + issue.length })
}

async function onFixSingle(issue: StyleIssue) {
  const key = issueKey(issue)
  fixingIssueKey.value = key
  try {
    const original = documentStore.content
    const modified = await fixSingleIssue(
      original,
      issue,
      documentStore.readerContext.description,
    )
    toolStore.setMergeState(original, modified)
  } finally {
    fixingIssueKey.value = null
  }
}

async function onFixAll() {
  fixingAll.value = true
  try {
    const original = documentStore.content
    const modified = await fixAllIssues(
      original,
      props.result.issues,
      documentStore.readerContext.description,
    )
    toolStore.setMergeState(original, modified)
  } finally {
    fixingAll.value = false
  }
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div v-if="props.result.issues.length === 0" class="text-sm text-gray-500">
      No issues found
    </div>

    <template v-else>
      <div class="flex items-center justify-between">
        <div class="text-sm font-medium text-gray-700">
          {{ props.result.issues.length }} issue{{ props.result.issues.length === 1 ? '' : 's' }} found
        </div>
        <button
          v-if="props.result.issues.length > 1 && settingsStore.hasKeyForCurrentProvider"
          data-testid="fix-all-btn"
          :disabled="fixingAll || isMergeActive || isFixing"
          class="rounded bg-violet-600 px-3 py-1 text-xs font-medium text-white hover:bg-violet-700 transition-colors disabled:opacity-50"
          @click="onFixAll"
        >
          {{ fixingAll ? 'Fixing...' : 'Fix All with AI' }}
        </button>
      </div>

      <div v-if="isMergeActive" class="rounded bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700">
        Review the pending suggestion before fixing another issue.
      </div>

      <div class="flex flex-col gap-2">
        <div
          v-for="issue in props.result.issues"
          :key="issueKey(issue)"
          data-testid="style-issue"
          class="rounded border border-gray-200 text-sm transition-colors"
        >
          <div
            :class="['p-3 transition-colors', isMergeActive ? 'opacity-60' : 'cursor-pointer hover:bg-blue-50']"
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
          <div
            v-if="settingsStore.hasKeyForCurrentProvider"
            class="border-t border-gray-100 px-3 py-1.5"
          >
            <button
              data-testid="fix-single-btn"
              :disabled="fixingIssueKey === issueKey(issue) || isMergeActive || isFixing"
              class="text-xs font-medium text-violet-600 hover:text-violet-800 transition-colors disabled:opacity-50"
              @click.stop="onFixSingle(issue)"
            >
              {{ fixingIssueKey === issueKey(issue) ? 'Fixing...' : 'Fix with AI' }}
            </button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
