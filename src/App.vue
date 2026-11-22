<script setup lang="ts">
import Message from 'primevue/message'
import { RouterLink, RouterView } from 'vue-router'
import { validation } from '@/data'

// Add new features here; the sidebar renders whatever is listed.
const navGroups = [
  {
    label: 'Essence',
    items: [
      { to: '/tracker', label: 'Tracker' },
      { to: '/optimizer', label: 'Farming Optimizer' },
    ],
  },
]
</script>

<template>
  <div class="app-shell">
    <aside class="app-sidebar">
      <div class="brand">
        <span class="brand-sub">Endfield</span>
        <h1>Essence Tools</h1>
      </div>
      <nav class="app-nav">
        <div v-for="group in navGroups" :key="group.label" class="nav-group">
          <div class="nav-group-label">{{ group.label }}</div>
          <RouterLink v-for="item in group.items" :key="item.to" :to="item.to">
            {{ item.label }}
          </RouterLink>
        </div>
      </nav>
    </aside>

    <main class="app-main">
      <Message v-if="validation.errors.length" severity="error">
        <div>Game data has problems:</div>
        <ul>
          <li v-for="e in validation.errors" :key="e">{{ e }}</li>
        </ul>
      </Message>
      <Message v-if="validation.warnings.length" severity="warn" :closable="true">
        <div>Data warnings:</div>
        <ul>
          <li v-for="w in validation.warnings" :key="w">{{ w }}</li>
        </ul>
      </Message>

      <RouterView />
    </main>
  </div>
</template>
