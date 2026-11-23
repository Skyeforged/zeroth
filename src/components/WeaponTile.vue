<script setup lang="ts">
import { computed } from 'vue'
import StatusTag from '@/components/StatusTag.vue'
import WeaponIcon from '@/components/WeaponIcon.vue'
import { rarityColor } from '@/lib/rarity'
import type { WeaponStatus } from '@/lib/status'

const props = defineProps<{
  weaponId: string
  name: string
  rarity?: number
  /** Tooltip, e.g. the essence stats. */
  title?: string
  status: WeaponStatus
}>()

defineEmits<{ select: [] }>()

const color = computed(() => rarityColor(props.rarity))
</script>

<template>
  <!-- Styled like the in-game operator roster card: art on hatching, name plate, rarity bar. -->
  <button
    type="button"
    class="tile"
    :class="{ rarity: color }"
    :style="color ? { '--rarity': color } : undefined"
    :title="title"
    :aria-label="`Add ${name}${rarity ? ` (${rarity} star)` : ''}`"
    @click="$emit('select')"
  >
    <!-- Square slot for the square icon art; the icon scales to fill it. -->
    <span class="art hatch-bg">
      <WeaponIcon :weapon-id="weaponId" :size="96" />
    </span>
    <span class="plate">
      <span class="name">{{ name }}</span>
      <!-- Rarity is shown by colour on the tile; the aria-label still names it. -->
      <StatusTag :status="status" class="status" />
    </span>
  </button>
</template>

<style scoped>
.tile {
  --rarity-bar: var(--border-strong);
  display: flex;
  flex-direction: column;
  align-items: stretch;
  padding: 0;
  background: var(--surface);
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
  border: 1px solid var(--border);
  border-bottom: 3px solid var(--rarity-bar);
  border-radius: var(--radius);
  transition:
    border-color 0.15s,
    box-shadow 0.15s,
    transform 0.15s;
}

.tile.rarity {
  --rarity-bar: var(--rarity);
}

.art {
  display: block;
  aspect-ratio: 1 / 1;
  padding: 0.25rem;
}

.tile.rarity .art {
  background-color: color-mix(in srgb, var(--rarity) 14%, transparent);
}

/* The tile already carries the rarity colour, so drop the icon's own frame and let the art fill the square. */
.art :deep(.frame) {
  width: 100%;
  height: 100%;
  border: none;
  background: none;
}

.art :deep(.weapon-icon) {
  width: 100%;
  height: 100%;
}

.plate {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  padding: 0.3rem 0.4rem 0.4rem;
}

.name {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-family: var(--font-display);
  font-size: 0.95rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  line-height: 1.1;
  min-height: 2.2em;
}

.status {
  align-self: flex-start;
  font-size: 0.6rem;
}

.tile:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
}

.tile:hover,
.tile:focus-visible {
  border-color: var(--primary);
  border-bottom-color: var(--rarity-bar);
  box-shadow: 0 0 0 1px var(--primary);
}

.tile.rarity:hover,
.tile.rarity:focus-visible {
  box-shadow:
    0 0 0 1px var(--primary),
    0 6px 14px -6px var(--rarity);
}

@media (prefers-reduced-motion: no-preference) {
  .tile:hover {
    transform: translateY(-2px);
  }
}
</style>
