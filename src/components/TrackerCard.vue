<script setup lang="ts">
import { computed } from 'vue'
import IconToggle from '@/components/IconToggle.vue'
import StatLevel from '@/components/StatLevel.vue'
import StatusTag from '@/components/StatusTag.vue'
import WeaponIcon from '@/components/WeaponIcon.vue'
import { LEVEL_MAX, LEVEL_MIN } from '@/lib/constants'
import { nameOf } from '@/lib/i18n'
import { rarityColor } from '@/lib/rarity'
import type { WeaponProgress, WeaponStatus } from '@/lib/status'
import { SLOTS, type Essence, type Slot } from '@/types/data'

/** One weapon in the Tracker grid. Presentational: changes are emitted, the view writes them to the store. */
const props = defineProps<{
  weaponId: string
  name: string
  rarity?: number
  essence: Essence
  progress: WeaponProgress
  status: WeaponStatus
  slotLabels: Record<Slot, string>
}>()

defineEmits<{
  level: [slot: Slot, value: number]
  update: [patch: { obtained?: boolean; completedOverride?: boolean }]
}>()

const color = computed(() => rarityColor(props.rarity))
</script>

<template>
  <article class="card" :class="status" :style="color ? { '--rarity': color } : undefined">
    <header class="head">
      <WeaponIcon :weapon-id="weaponId" :size="56" />
      <div class="ident">
        <h3 class="name" :title="name">{{ name }}</h3>
        <div class="meta">
          <span v-if="rarity" class="stars">{{ rarity }}★</span>
          <StatusTag :status="status" />
        </div>
      </div>
      <div class="flags">
        <IconToggle
          icon="box"
          label="Obtained"
          tone="info"
          :model-value="progress.obtained"
          @update:model-value="(v: boolean) => $emit('update', { obtained: v })"
        />
        <IconToggle
          icon="check-circle"
          label="Mark completed"
          tone="success"
          :model-value="progress.completedOverride"
          @update:model-value="(v: boolean) => $emit('update', { completedOverride: v })"
        />
      </div>
    </header>

    <div class="stats">
      <template v-for="slot in SLOTS" :key="slot">
        <!-- 3-star weapons have no slot-2 sub stat -->
        <div v-if="essence[slot] === undefined" class="na">
          <span class="na-bullet" aria-hidden="true" />{{ slotLabels[slot] }}: n/a
        </div>
        <StatLevel
          v-else
          :name="nameOf('stats', essence[slot]!)"
          :tone="slot"
          :slot-label="slotLabels[slot]"
          :model-value="progress.levels[slot]"
          :min="LEVEL_MIN"
          :max="LEVEL_MAX[slot]"
          :disabled="!progress.obtained"
          @update:model-value="(v: number) => $emit('level', slot, v)"
        />
      </template>
    </div>
  </article>
</template>

<style scoped>
.card {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  min-width: 0;
  padding: 0.6rem 0.75rem 0.75rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-top: 3px solid var(--rarity, var(--border-strong));
  border-radius: var(--radius);
  transition: border-color 0.15s;
}

.card:hover {
  border-left-color: var(--border-strong);
  border-right-color: var(--border-strong);
  border-bottom-color: var(--border-strong);
}

.card.completed {
  box-shadow: inset 3px 0 0 var(--green-500);
}

.head {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  min-width: 0;
}

.unobtained .head :deep(.frame),
.unobtained .ident {
  opacity: 0.6;
}

.ident {
  flex: 1;
  min-width: 0;
}

/* Up to two lines, then ellipsis. */
.name {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  margin: 0;
  overflow: hidden;
  overflow-wrap: break-word;
  font-family: var(--font-display);
  font-size: 1.1rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  line-height: 1.15;
}

.meta {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-top: 0.15rem;
}

.stars {
  color: var(--rarity, var(--text-muted));
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 700;
}

.flags {
  display: flex;
  gap: 0.125rem;
  align-self: flex-start;
}

.stats {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.na {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
  color: var(--text-muted);
}

.na-bullet {
  width: 0.5rem;
  height: 0.5rem;
  border: 2px solid var(--border-strong);
  border-radius: 50%;
}
</style>
