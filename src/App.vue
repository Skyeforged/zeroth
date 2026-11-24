<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import UiMessage from '@/components/ui/UiMessage.vue'
import { validation } from '@/data'
import { navGroups } from '@/router/nav'

const route = useRoute()

/** The nav entry (and its group) for the current page, shown in the page header. */
const current = computed(() => {
  for (const group of navGroups) {
    const item = group.items.find((i) => route.path.startsWith(i.to))
    if (item) return { group: group.label, label: item.label }
  }
  return undefined
})

const index = (i: number) => String(i + 1).padStart(2, '0')
</script>

<template>
  <div class="app-shell">
    <aside class="app-sidebar">
      <div class="brand">
        <RouterLink to="/" class="brand-link" aria-label="Zeroth home">
          <h1>
            <span class="brand-mark">Zeroth</span>
            <span class="brand-sub">Arknights: Endfield</span>
          </h1>
        </RouterLink>
        <span class="tri-stripe" aria-hidden="true" />
      </div>
      <nav class="app-nav">
        <div v-for="group in navGroups" :key="group.label" class="nav-group">
          <div class="nav-group-label">{{ group.label }}</div>
          <RouterLink v-for="(item, i) in group.items" :key="item.to" :to="item.to">
            <span class="nav-index" aria-hidden="true">{{ index(i) }}</span>
            <span>{{ item.label }}</span>
          </RouterLink>
        </div>
      </nav>
    </aside>

    <main class="app-main">
      <header v-if="current" class="page-head">
        <h2 class="page-title">{{ current.label }}</h2>
        <div class="page-plate" aria-hidden="true">
          <span class="tri-stripe" />
          <span>{{ current.group }} // Endfield</span>
        </div>
      </header>

      <UiMessage v-if="validation.errors.length" severity="danger" icon="times-circle">
        <div>Game data has problems:</div>
        <ul>
          <li v-for="e in validation.errors" :key="e">{{ e }}</li>
        </ul>
      </UiMessage>
      <UiMessage v-if="validation.warnings.length" severity="warn" icon="warning" closable>
        <div>Data warnings:</div>
        <ul>
          <li v-for="w in validation.warnings" :key="w">{{ w }}</li>
        </ul>
      </UiMessage>

      <RouterView />
    </main>
  </div>
</template>
