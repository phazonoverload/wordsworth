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

const showKeys = ref<Record<string, boolean>>({
  openai: false,
  anthropic: false,
  google: false,
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
    settingsStore.setModel(found.models[0])
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

function toggleKeyVisibility(providerId: string) {
  showKeys.value[providerId] = !showKeys.value[providerId]
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
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md pointer-events-auto">
          <!-- Header -->
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Settings</h2>
            <button
              data-testid="close-button"
              class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              @click="close"
            >
              &times;
            </button>
          </div>

          <!-- Provider selection -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              AI Provider
            </label>
            <select
              data-testid="provider-select"
              :value="settingsStore.provider"
              class="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
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
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Model
            </label>
            <select
              data-testid="model-select"
              :value="settingsStore.model"
              class="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
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

          <!-- API Keys -->
          <div class="space-y-4">
            <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300">API Keys</h3>
            <div
              v-for="p in PROVIDERS"
              :key="p.value"
              class="flex items-center gap-2"
            >
              <!-- Key configured indicator -->
              <span
                :data-testid="`key-indicator-${p.value}`"
                class="inline-block w-2 h-2 rounded-full flex-shrink-0"
                :class="settingsStore.keys[p.value] ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'"
              />
              <label class="text-sm text-gray-600 dark:text-gray-400 w-20 flex-shrink-0">
                {{ p.label }}
              </label>
              <input
                :data-testid="`key-input-${p.value}`"
                :type="showKeys[p.value] ? 'text' : 'password'"
                :value="settingsStore.keys[p.value] ?? ''"
                :placeholder="`${p.label} API key`"
                class="flex-1 border border-gray-300 dark:border-gray-600 rounded px-3 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                @input="onKeyInput(p.value, $event)"
              />
              <button
                :data-testid="`key-toggle-${p.value}`"
                class="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex-shrink-0"
                @click="toggleKeyVisibility(p.value)"
              >
                {{ showKeys[p.value] ? 'Hide' : 'Show' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
