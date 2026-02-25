<script setup lang="ts">
import { ref, computed } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import type { ProviderId } from '@/stores/settings'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

const settingsStore = useSettingsStore()

const PROVIDERS = [
  { value: 'openai' as const, label: 'OpenAI', models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'] },
  { value: 'anthropic' as const, label: 'Anthropic', models: ['claude-sonnet-4-20250514', 'claude-haiku-4-20250514'] },
  { value: 'google' as const, label: 'Google', models: ['gemini-2.5-flash', 'gemini-2.5-pro'] },
]

const showKey = ref(false)

const currentProviderLabel = computed(() => {
  const found = PROVIDERS.find((p) => p.value === settingsStore.provider)
  return found ? found.label : ''
})

const currentModels = computed(() => {
  const found = PROVIDERS.find((p) => p.value === settingsStore.provider)
  return found ? found.models : []
})

function onProviderChange(event: Event) {
  const target = event.target as HTMLSelectElement
  settingsStore.setProvider(target.value)
  // Auto-select first model of the new provider
  const found = PROVIDERS.find((p) => p.value === target.value)
  if (found && found.models.length > 0) {
    settingsStore.setModel(found.models[0] as string)
  }
}

function onModelChange(event: Event) {
  const target = event.target as HTMLSelectElement
  settingsStore.setModel(target.value)
}

function onKeyInput(providerId: ProviderId, event: Event) {
  const target = event.target as HTMLInputElement
  settingsStore.setKey(providerId, target.value)
}

function close() {
  emit('update:modelValue', false)
}

function onOverlayClick(event: MouseEvent) {
  if (event.target === event.currentTarget) {
    close()
  }
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    close()
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="props.modelValue"
      data-testid="settings-modal"
      class="fixed inset-0 z-50"
      @keydown="onKeydown"
    >
      <!-- Overlay -->
      <div
        data-testid="modal-overlay"
        class="absolute inset-0 bg-black/50"
        @click="onOverlayClick"
      />

      <!-- Modal content -->
      <div class="relative flex items-center justify-center h-full pointer-events-none">
        <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md pointer-events-auto">
          <!-- Header -->
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-lg font-semibold text-gray-900">Settings</h2>
            <button
              data-testid="close-button"
              class="text-gray-400 hover:text-gray-600"
              @click="close"
            >
              &times;
            </button>
          </div>

          <!-- Provider selection -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">
              AI Provider
            </label>
            <select
              data-testid="provider-select"
              :value="settingsStore.provider"
              class="w-full border border-gray-300 rounded px-3 py-2 bg-white text-gray-900"
              @change="onProviderChange"
            >
              <option
                v-for="p in PROVIDERS"
                :key="p.value"
                :value="p.value"
              >
                {{ p.label }}
              </option>
            </select>
          </div>

          <!-- Model selection -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Model
            </label>
            <select
              data-testid="model-select"
              :value="settingsStore.model"
              class="w-full border border-gray-300 rounded px-3 py-2 bg-white text-gray-900"
              @change="onModelChange"
            >
              <option
                v-for="m in currentModels"
                :key="m"
                :value="m"
              >
                {{ m }}
              </option>
            </select>
          </div>

          <!-- API Key for current provider -->
          <div class="space-y-2">
            <h3 class="text-sm font-medium text-gray-700">API Key</h3>
            <div class="flex items-center gap-2">
              <span
                data-testid="key-indicator"
                class="inline-block w-2 h-2 rounded-full flex-shrink-0"
                :class="settingsStore.hasKeyForCurrentProvider ? 'bg-green-500' : 'bg-gray-300'"
              />
              <label class="text-sm text-gray-600 flex-shrink-0">
                {{ currentProviderLabel }}
              </label>
              <input
                data-testid="key-input"
                :type="showKey ? 'text' : 'password'"
                :value="settingsStore.keys[settingsStore.provider as ProviderId] ?? ''"
                :placeholder="`${currentProviderLabel} API key`"
                class="flex-1 border border-gray-300 rounded px-3 py-1.5 text-sm bg-white text-gray-900"
                @input="onKeyInput(settingsStore.provider as ProviderId, $event)"
              />
              <button
                data-testid="key-toggle"
                class="text-xs text-gray-500 hover:text-gray-700 flex-shrink-0"
                @click="showKey = !showKey"
              >
                {{ showKey ? 'Hide' : 'Show' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
