<script setup lang="ts">
import type { Slot } from '@/types/data'

/** `tone` colours the chip by essence slot; `state` (Energy Alluvium cards) takes precedence over it. */
defineProps<{ label: string; state?: 'ok' | 'missing' | 'neutral'; tone?: Slot }>()
</script>

<template>
  <span class="chip" :class="[state ?? 'neutral', state ? undefined : tone]">
    <i v-if="state === 'ok'" class="pi pi-check" />
    <i v-else-if="state === 'missing'" class="pi pi-times" />
    {{ label }}
  </span>
</template>

<style scoped>
.chip {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.1rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  border: 1px solid var(--p-content-border-color);
  background: color-mix(in srgb, var(--p-text-muted-color) 12%, transparent);
}

.chip i {
  font-size: 0.7rem;
}

.ok {
  color: var(--p-green-500);
  border-color: var(--p-green-500);
  background: color-mix(in srgb, var(--p-green-500) 16%, transparent);
}

.missing {
  color: var(--p-text-muted-color);
}

.slot1,
.slot2,
.slot3 {
  --tone: var(--slot1-color);
  color: var(--tone);
  font-weight: 600;
  border-color: color-mix(in srgb, var(--tone) 45%, transparent);
  background: color-mix(in srgb, var(--tone) 14%, transparent);
}

.slot2 {
  --tone: var(--slot2-color);
}

.slot3 {
  --tone: var(--slot3-color);
}
</style>
