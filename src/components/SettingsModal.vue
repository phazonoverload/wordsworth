<script setup lang="ts">
import { ref, computed } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { DEFAULT_OLLAMA_BASE_URL, DEFAULT_OLLAMA_MODEL } from '@/stores/settings'
import type { ProviderId } from '@/stores/settings'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

const settingsStore = useSettingsStore()

const PROVIDERS = [
  { value: 'openai' as const, label: 'OpenAI', model: 'gpt-5-nano' },
  { value: 'anthropic' as const, label: 'Claude', model: 'claude-haiku-4-5' },
  { value: 'google' as const, label: 'Gemini', model: 'gemini-2.5-flash' },
  { value: 'ollama' as const, label: 'Ollama', model: DEFAULT_OLLAMA_MODEL },
]

const showKey = ref(false)

const isOllama = computed(() => settingsStore.provider === 'ollama')

const currentProvider = computed(() =>
  PROVIDERS.find((p) => p.value === settingsStore.provider) ?? PROVIDERS[0]!
)

const currentModelName = computed(() => {
  if (isOllama.value) return settingsStore.model
  return currentProvider.value!.model
})

function selectProvider(p: typeof PROVIDERS[number]) {
  settingsStore.setProvider(p.value)
  if (p.value === 'ollama') {
    // For Ollama, only set default model if switching from another provider
    if (!settingsStore.model || !settingsStore.model.includes(':')) {
      settingsStore.setModel(p.model)
    }
  } else {
    settingsStore.setModel(p.model)
  }
}

function onModelInput(event: Event) {
  const target = event.target as HTMLInputElement
  settingsStore.setModel(target.value)
}

function onBaseUrlInput(event: Event) {
  const target = event.target as HTMLInputElement
  settingsStore.setOllamaBaseUrl(target.value)
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
        <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4 pointer-events-auto">
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

          <!-- Provider selection (4-button toggle) -->
          <div class="mb-4">
            <div
              data-testid="provider-select"
              class="inline-flex w-full rounded-lg border border-gray-200 bg-gray-100 p-0.5"
            >
              <button
                v-for="p in PROVIDERS"
                :key="p.value"
                :data-testid="`provider-btn-${p.value}`"
                :class="[
                  'flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all',
                  settingsStore.provider === p.value
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700',
                ]"
                @click="selectProvider(p)"
              >
                {{ p.label }}
              </button>
            </div>
            <p class="mt-3 text-sm text-gray-600">
              Wordsworth will use <span class="font-medium text-gray-900">{{ currentModelName }}</span>
            </p>
          </div>

          <!-- Ollama-specific settings -->
          <template v-if="isOllama">
            <div class="space-y-4">
              <!-- Model name input -->
              <div class="space-y-2">
                <h3 class="text-sm font-medium text-gray-700">Model</h3>
                <input
                  data-testid="ollama-model-input"
                  type="text"
                  :value="settingsStore.model"
                  :placeholder="DEFAULT_OLLAMA_MODEL"
                  class="w-full border border-gray-300 rounded px-3 py-1.5 text-sm bg-white text-gray-900"
                  @input="onModelInput"
                />
                <p class="text-xs text-gray-500">
                  The model name as shown by <code class="bg-gray-100 px-1 rounded">ollama list</code>
                </p>
              </div>

              <!-- Base URL input -->
              <div class="space-y-2">
                <h3 class="text-sm font-medium text-gray-700">Base URL</h3>
                <input
                  data-testid="ollama-base-url-input"
                  type="text"
                  :value="settingsStore.ollamaBaseUrl"
                  :placeholder="DEFAULT_OLLAMA_BASE_URL"
                  class="w-full border border-gray-300 rounded px-3 py-1.5 text-sm bg-white text-gray-900"
                  @input="onBaseUrlInput"
                />
              </div>
            </div>
          </template>

          <!-- API Key for cloud providers -->
          <div v-else class="space-y-2">
            <h3 class="text-sm font-medium text-gray-700">API Key</h3>
            <div class="flex items-center gap-2">
              <span
                data-testid="key-indicator"
                class="inline-block w-2 h-2 rounded-full flex-shrink-0"
                :class="settingsStore.isConfigured ? 'bg-green-500' : 'bg-gray-300'"
              />
              <input
                data-testid="key-input"
                :type="showKey ? 'text' : 'password'"
                :value="settingsStore.keys[settingsStore.provider as ProviderId] ?? ''"
                :placeholder="`${currentProvider!.label} API key`"
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
