<script setup lang="ts">
import { computed } from 'vue'
import type { PromiseResult as PromiseResultType, PromiseVerdict } from '@/tools/types'

const props = defineProps<{
  result: PromiseResultType
}>()

const fulfilledCount = computed(() =>
  props.result.verdicts.filter((v) => v.verdict === 'pass').length,
)

function verdictIcon(verdict: PromiseVerdict['verdict']): string {
  if (verdict === 'pass') return '\u2713'
  if (verdict === 'fail') return '\u2717'
  return '\u26A0'
}

function verdictColor(verdict: PromiseVerdict['verdict']): string {
  if (verdict === 'pass') return 'text-green-600'
  if (verdict === 'fail') return 'text-red-600'
  return 'text-yellow-600'
}

function getVerdict(promiseId: string): PromiseVerdict | undefined {
  return props.result.verdicts.find((v) => v.promiseId === promiseId)
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="text-sm font-medium text-gray-700">
      {{ fulfilledCount }} of {{ props.result.promises.length }} promises fulfilled
    </div>

    <div class="flex flex-col gap-3">
      <div
        v-for="promise in props.result.promises"
        :key="promise.id"
        class="rounded border border-gray-200 p-3 text-sm"
      >
        <div class="mb-1 text-gray-800">{{ promise.text }}</div>
        <template v-if="getVerdict(promise.id)">
          <div
            :data-testid="`verdict-${promise.id}`"
            :class="['flex items-center gap-1 font-medium', verdictColor(getVerdict(promise.id)!.verdict)]"
          >
            <span>{{ verdictIcon(getVerdict(promise.id)!.verdict) }}</span>
            <span class="capitalize">{{ getVerdict(promise.id)!.verdict }}</span>
          </div>
          <div class="mt-1 text-xs text-gray-500">
            {{ getVerdict(promise.id)!.evidence }}
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
