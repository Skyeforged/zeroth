/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** GA4 measurement id (`G-XXXXXXXXXX`). Analytics is off when unset. */
  readonly VITE_GA_MEASUREMENT_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
