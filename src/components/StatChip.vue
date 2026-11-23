<script setup lang="ts">
import UiIcon from '@/components/ui/UiIcon.vue'
import type { Slot } from '@/types/data'

/** `tone` colours the chip by essence slot; `state` (Energy Alluvium cards) takes precedence over it. */
defineProps<{ label: string; state?: 'ok' | 'missing' | 'neutral'; tone?: Slot }>()
</script>

<template>
  <span class="chip" :class="[state ?? 'neutral', state ? undefined : tone]">
    <UiIcon v-if="state === 'ok'" name="check" class="mark" />
    <UiIcon v-else-if="state === 'missing'" name="times" class="mark" />
    {{ label }}
  </span>
</template>

<style scoped>
.chip {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.1rem 0.5rem;
  border-radius: var(--radius);
  font-size: 0.8rem;
  border: 1px solid var(--border);
  background: color-mix(in srgb, var(--text-muted) 12%, transparent);
}

.mark {
  font-size: 0.7rem;
}

.ok {
  color: var(--green-500);
  border-color: var(--green-500);
  background: color-mix(in srgb, var(--green-500) 16%, transparent);
}

.missing {
  color: var(--text-muted);
}

.slot1,
.slot2,
.slot3 {
  --tone: var(--slot1-color);
  color: var(--tone);
  font-weight: 600;
  border-color: color-mix(in srgb, var(--tone) 40%, transparent);
  border-left: 2px solid var(--tone);
  background: color-mix(in srgb, var(--tone) 12%, transparent);
}

.slot2 {
  --tone: var(--slot2-color);
}

.slot3 {
  --tone: var(--slot3-color);
}
</style>
