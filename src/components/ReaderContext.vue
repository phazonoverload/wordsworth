<script setup lang="ts">
import { ref } from 'vue'
import { useDocumentStore } from '@/stores/document'

const PRESETS = [
  { value: 'senior-devs', label: 'Senior developers', description: 'Senior developers familiar with the tech stack' },
  { value: 'junior-devs', label: 'Junior developers', description: 'Junior developers learning the basics' },
  { value: 'non-technical', label: 'Non-technical stakeholders', description: 'Non-technical stakeholders (PMs, executives)' },
  { value: 'general', label: 'General audience', description: 'General technical audience' },
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
  <div class="flex flex-col gap-2 border-b border-gray-200 px-5 py-4">
    <label class="text-xs font-medium text-gray-500">Target Audience</label>
    <select
      :value="selectedPreset"
      class="rounded border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900"
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
    <textarea
      :value="description"
      rows="2"
      class="rounded border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 resize-none"
      placeholder="Describe your target audience..."
      @input="onDescriptionInput"
    />
  </div>
</template>
