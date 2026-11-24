<script setup lang="ts">
import { RouterLink } from 'vue-router'
import UiCard from '@/components/ui/UiCard.vue'
import { navGroups } from '@/router/nav'
</script>

<template>
  <div class="home">
    <header class="page-head">
      <h2 class="page-title">Zeroth</h2>
      <div class="page-plate" aria-hidden="true">
        <span class="tri-stripe" />
        <span>Tools // Endfield</span>
      </div>
    </header>

    <p class="home-intro">Tools for Arknights: Endfield. Pick a feature to get started.</p>

    <div class="home-grid">
      <UiCard v-for="group in navGroups" :key="group.label">
        <template #title>{{ group.label }}</template>
        <template #subtitle>{{ group.description }}</template>
        <ul class="home-links">
          <li v-for="item in group.items" :key="item.to">
            <RouterLink :to="item.to">{{ item.label }}</RouterLink>
          </li>
        </ul>
      </UiCard>
    </div>
  </div>
</template>

<style scoped>
.home-intro {
  margin: 0 0 1rem;
  color: var(--text-muted);
}

.home-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr));
  gap: 1rem;
}

.home-links {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.home-links a {
  font-family: var(--font-display);
  font-size: 1.1rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--primary-text);
  text-decoration: none;
}

.home-links a::before {
  content: '> ';
  color: var(--text-muted);
}

.home-links a:hover,
.home-links a:focus-visible {
  text-decoration: underline;
}
</style>
