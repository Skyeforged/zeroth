// Self-hosted fonts (bundled by Vite, so they work under the GitHub Pages base path).
import '@fontsource/barlow/400.css'
import '@fontsource/barlow/500.css'
import '@fontsource/barlow/600.css'
import '@fontsource/barlow-condensed/500.css'
import '@fontsource/barlow-condensed/600.css'
import '@fontsource/barlow-condensed/700.css'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/700.css'
import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { initAnalytics, trackPageView } from './lib/analytics'

// Production builds only, and only when a measurement id was provided at build time.
if (import.meta.env.PROD) {
  initAnalytics(import.meta.env.VITE_GA_MEASUREMENT_ID)
  router.afterEach((to, _from, failure) => {
    if (!failure) trackPageView(to.fullPath)
  })
}

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
