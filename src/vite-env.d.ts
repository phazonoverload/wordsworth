/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DISABLE_OLLAMA?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
