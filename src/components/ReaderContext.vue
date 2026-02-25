<script setup lang="ts">
import { ref } from 'vue'
import { useDocumentStore } from '@/stores/document'

const PRESETS = [
  { value: 'senior-devs', label: 'Senior developers', description: 'Senior developers who are familiar with the tech stack and comfortable with technical jargon, acronyms, and advanced concepts' },
  { value: 'junior-devs', label: 'Junior developers', description: 'Junior developers who are still learning the basics and benefit from clear explanations, defined terms, and step-by-step reasoning' },
  { value: 'non-technical', label: 'Non-technical stakeholders', description: 'Non-technical stakeholders such as product managers, executives, and clients who need plain language, minimal jargon, and clear business context' },
  { value: 'general', label: 'General audience', description: 'A general technical audience with mixed experience levels who appreciate clear writing without assuming deep domain expertise' },
  { value: 'custom', label: 'Custom...', description: '' },
]

const store = useDocumentStore()

const selectedPreset = ref(store.readerContext.preset ?? 'general')
const description = ref(store.readerContext.description)

function onPresetChange(event: Event) {
  const value = (event.target as HTMLSelectElement).value
  selectedPreset.value = value
  const preset = PRESETS.find((p) => p.value === value)
  description.value = preset?.description ?? ''
  store.setReaderContext({ description: description.value, preset: value })
}

function onDescriptionInput(event: Event) {
  const value = (event.target as HTMLTextAreaElement).value
  description.value = value
  store.setReaderContext({ description: value, preset: selectedPreset.value })
}
</script>

<template>
  <div class="flex flex-col gap-2 rounded border border-gray-200 p-3">
    <label class="text-xs font-medium text-gray-500">Target Audience</label>
    <div class="flex items-center gap-2">
      <span class="shrink-0 text-xs text-gray-400">Preset:</span>
      <select
        :value="selectedPreset"
        class="flex-1 rounded border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900"
        @change="onPresetChange"
      >
        <option
          v-for="preset in PRESETS"
          :key="preset.value"
          :value="preset.value"
        >
          {{ preset.label }}
        </option>
      </select>
    </div>
    <textarea
      :value="description"
      rows="4"
      class="rounded border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 resize-none"
      placeholder="Describe your target audience..."
      @input="onDescriptionInput"
    />
  </div>
</template>
