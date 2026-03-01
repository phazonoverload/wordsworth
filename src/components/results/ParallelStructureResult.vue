<script setup lang="ts">
import type {
  ParallelStructureResult as ParallelStructureResultType,
  ParallelStructureIssue,
  ParallelStructureIssueKind,
} from '@/tools/types'
import { useToolStore } from '@/stores/tools'
import { useDocumentStore } from '@/stores/document'
import { useSettingsStore } from '@/stores/settings'
import { fixParallelSingle, fixParallelAll } from '@/tools/parallel-fix'
import { ref, computed } from 'vue'

const props = defineProps<{
  result: ParallelStructureResultType
}>()

const toolStore = useToolStore()
const documentStore = useDocumentStore()
const settingsStore = useSettingsStore()

const fixingIssueKey = ref<string | null>(null)
const fixingAll = ref(false)
const isMergeActive = computed(() => !!(toolStore.mergeOriginal && toolStore.mergeModified))
const isFixing = computed(() => fixingIssueKey.value !== null || fixingAll.value)

const uniqueListCount = computed(() => {
  const indices = new Set(props.result.issues.map(i => i.listIndex))
  return indices.size
})

function kindClasses(kind: ParallelStructureIssueKind): string {
  switch (kind) {
    case 'pattern':
      return 'bg-orange-100 text-orange-800'
    case 'capitalization':
      return 'bg-blue-100 text-blue-800'
    case 'punctuation':
      return 'bg-teal-100 text-teal-800'
  }
}

function issueKey(issue: ParallelStructureIssue): string {
  return `${issue.listIndex}-${issue.itemIndex}-${issue.kind}`
}

function onIssueClick(issue: ParallelStructureIssue) {
  if (isMergeActive.value) return
  toolStore.setHighlightRange({ from: issue.itemAbsoluteOffset, to: issue.itemAbsoluteOffset + issue.itemLength })
}

async function onFixSingle(issue: ParallelStructureIssue) {
  const key = issueKey(issue)
  fixingIssueKey.value = key
  try {
    const original = documentStore.content
    const list = props.result.lists[issue.listIndex]!
    const modified = await fixParallelSingle(
      original,
      issue,
      list,
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
    const modified = await fixParallelAll(
      original,
      props.result.issues,
      props.result.lists,
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
      No issues found — all lists have parallel structure
    </div>

    <template v-else>
      <div class="flex items-center justify-between">
        <div class="text-sm font-medium text-gray-700">
          {{ props.result.issues.length }} issue{{ props.result.issues.length === 1 ? '' : 's' }} found across {{ uniqueListCount }} list{{ uniqueListCount === 1 ? '' : 's' }}
        </div>
        <button
          v-if="props.result.issues.length > 1 && settingsStore.hasKeyForCurrentProvider"
          data-testid="fix-all-btn"
          :disabled="fixingAll || isMergeActive || isFixing"
          class="rounded bg-orange-500 px-3 py-1 text-xs font-medium text-white hover:bg-orange-600 transition-colors disabled:opacity-50"
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
          data-testid="parallel-issue"
          class="rounded border border-gray-200 text-sm transition-colors"
        >
          <div
            :class="['p-3 transition-colors', isMergeActive ? 'opacity-60' : 'cursor-pointer hover:bg-orange-50']"
            @click="onIssueClick(issue)"
          >
            <div class="mb-1 flex items-center gap-2">
              <span
                data-testid="kind-badge"
                :class="['rounded px-2 py-0.5 text-xs font-medium', kindClasses(issue.kind)]"
              >
                {{ issue.kind }}
              </span>
              <span class="text-xs text-gray-400">Line {{ issue.itemLine }}</span>
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
              class="text-xs font-medium text-orange-600 hover:text-orange-800 transition-colors disabled:opacity-50"
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
