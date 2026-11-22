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
  <button
    type="button"
    class="tile"
    :class="{ rarity: color }"
    :style="color ? { '--rarity': color } : undefined"
    :title="title"
    :aria-label="`Add ${name}${rarity ? ` (${rarity} star)` : ''}`"
    @click="$emit('select')"
  >
    <WeaponIcon :weapon-id="weaponId" :size="56" />
    <span class="name">{{ name }}</span>
    <!-- Text as well as colour, so rarity does not depend on colour alone. -->
    <span v-if="rarity" class="stars">{{ rarity }}★</span>
    <StatusTag :status="status" class="status" />
  </button>
</template>

<style scoped>
.tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  padding: 0.5rem 0.4rem;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: center;
  cursor: pointer;
  border: 1px solid var(--p-content-border-color);
  border-radius: 6px;
}

.tile.rarity {
  border-color: var(--rarity);
  border-top-width: 4px;
}

.tile:hover,
.tile:focus-visible {
  border-color: var(--p-primary-color);
}

.tile.rarity:hover,
.tile.rarity:focus-visible {
  border-color: var(--rarity);
  box-shadow: 0 0 8px var(--rarity);
}

.name {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-size: 0.8rem;
  line-height: 1.2;
  min-height: 2.4em;
}

.stars {
  color: var(--rarity);
  font-size: 0.75rem;
  font-weight: 600;
}

.status {
  font-size: 0.65rem;
}
</style>
