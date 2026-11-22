<script setup lang="ts">
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import StatChip from '@/components/StatChip.vue'
import WeaponIcon from '@/components/WeaponIcon.vue'
import type { Slot } from '@/types/data'

defineProps<{
  /** Weapon id for the icon; omit for custom essences. */
  iconId?: string
  label: string
  /** Stat names with the slot they belong to (a 3-star weapon has no slot 2), coloured per slot. */
  stats: { slot: Slot; name: string }[]
  custom: boolean
  priority: boolean
  shield: boolean
}>()

defineEmits<{
  'toggle-priority': []
  'toggle-shield': []
  remove: []
}>()
</script>

<template>
  <div class="card" :class="{ priority }">
    <Button
      :icon="priority ? 'pi pi-star-fill' : 'pi pi-star'"
      :severity="priority ? 'warn' : 'secondary'"
      outlined
      :aria-label="priority ? 'Priority (click for Average)' : 'Average (click for Priority)'"
      :aria-pressed="priority"
      size="small"
      @click="$emit('toggle-priority')"
    />
    <Button
      icon="pi pi-shield"
      :severity="shield ? 'info' : 'secondary'"
      :outlined="!shield"
      :aria-pressed="shield"
      aria-label="Only the 3rd line (skill) stat matters"
      size="small"
      @click="$emit('toggle-shield')"
    />
    <WeaponIcon v-if="iconId" :weapon-id="iconId" :size="44" />
    <div class="body">
      <strong>{{ label }}</strong>
      <div class="stats">
        <StatChip v-for="s in stats" :key="s.slot" :label="s.name" :tone="s.slot" />
      </div>
      <div v-if="custom || shield" class="tags">
        <Tag v-if="custom" value="Custom" severity="secondary" />
        <Tag v-if="shield" value="Slot 3 only" severity="info" />
      </div>
    </div>
    <Button icon="pi pi-times" severity="secondary" text size="small" aria-label="Remove" @click="$emit('remove')" />
  </div>
</template>

<style scoped>
.card {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--p-content-border-color);
  border-radius: 6px;
}

.card.priority {
  border-color: var(--p-yellow-500);
}

.body {
  flex: 1;
  min-width: 0;
}

.stats {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  margin-top: 0.2rem;
}

.tags {
  display: flex;
  gap: 0.35rem;
  margin-top: 0.25rem;
}
</style>
