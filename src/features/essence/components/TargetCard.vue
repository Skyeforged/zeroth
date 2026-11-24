<script setup lang="ts">
import IconToggle from '@/components/IconToggle.vue'
import StatChip from '@/features/essence/components/StatChip.vue'
import UiIcon from '@/components/ui/UiIcon.vue'
import UiTag from '@/components/ui/UiTag.vue'
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
    <WeaponIcon v-if="iconId" :weapon-id="iconId" :size="48" />
    <div class="body">
      <div class="top">
        <strong class="name" :title="label">{{ label }}</strong>
        <!-- All three actions share one size so the row reads as a single control strip. -->
        <div class="actions">
          <IconToggle
            :icon="priority ? 'star-fill' : 'star'"
            tone="warn"
            :label="priority ? 'Priority (click for Average)' : 'Average (click for Priority)'"
            :model-value="priority"
            @update:model-value="$emit('toggle-priority')"
          />
          <IconToggle
            icon="shield"
            tone="info"
            label="Only the 3rd line (skill) stat matters"
            :model-value="shield"
            @update:model-value="$emit('toggle-shield')"
          />
          <button type="button" class="remove" aria-label="Remove" title="Remove" @click="$emit('remove')">
            <UiIcon name="times" />
          </button>
        </div>
      </div>
      <div class="stats">
        <StatChip v-for="s in stats" :key="s.slot" :label="s.name" :tone="s.slot" />
        <UiTag v-if="custom" value="Custom" severity="secondary" />
        <UiTag v-if="shield" value="Slot 3 only" severity="info" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.card {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  min-width: 0;
  padding: 0.4rem 0.4rem 0.45rem 0.5rem;
  border: 1px solid var(--border);
  border-left: 3px solid var(--border-strong);
  border-radius: var(--radius);
  background: var(--surface);
}

.card.priority {
  border-color: var(--primary);
  background: linear-gradient(90deg, color-mix(in srgb, var(--primary) 12%, var(--surface)), var(--surface) 60%);
}

.body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.top {
  display: flex;
  align-items: flex-start;
  gap: 0.4rem;
}

.name {
  flex: 1;
  min-width: 0;
  /* Wrap at word boundaries, up to two lines, then ellipsis. */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  overflow-wrap: break-word;
  padding-top: 0.15rem;
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  line-height: 1.2;
}

.actions {
  flex: none;
  display: flex;
  gap: 0.125rem;
}

/* Matches IconToggle's footprint. */
.remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.6rem;
  height: 1.6rem;
  padding: 0;
  border: 1px solid transparent;
  border-radius: var(--radius);
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition:
    background 0.15s,
    color 0.15s;
}

.remove:hover {
  color: var(--red-500);
  background: color-mix(in srgb, var(--red-500) 12%, transparent);
}

.remove:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 1px;
}

.stats {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}
</style>
