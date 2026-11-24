<script setup lang="ts">
import { computed } from 'vue'
import StatChip from '@/features/essence/components/StatChip.vue'
import UiIcon from '@/components/ui/UiIcon.vue'
import { ENGRAVING_MAIN_PICKS } from '@/features/essence/lib/constants'
import { nameOf } from '@/lib/i18n'
import type { Engraving, Lock } from '@/features/essence/lib/optimizer'

const props = defineProps<{ engraving: Engraving; altLocks: Lock[] }>()

const mainSlots = computed(() => {
  const picks = props.engraving.requiredMain.map((s) => ({ label: nameOf('stats', s), any: false }))
  while (picks.length < ENGRAVING_MAIN_PICKS) picks.push({ label: '[Any]', any: true })
  return picks
})

const locks = computed(() => [props.engraving.lock, ...props.altLocks])
</script>

<template>
  <div class="strip">
    <strong><UiIcon name="lock" /> Recommended Pre-Engrave</strong>
    <div class="row">
      <StatChip v-for="(m, i) in mainSlots" :key="i" :label="m.label" tone="slot1" :class="{ any: m.any }" />
      <span>+</span>
      <template v-for="(l, i) in locks" :key="`${l.slot}:${l.stat}`">
        <span v-if="i > 0" class="muted">/</span>
        <StatChip :label="nameOf('stats', l.stat)" :tone="l.slot" />
      </template>
    </div>
  </div>
</template>

<style scoped>
.strip {
  margin-top: 0.85rem;
  padding: 0.6rem 0.75rem;
  border: 1px dashed var(--border-strong);
  border-left: 3px solid var(--primary);
  background: var(--surface-2);
}

.strip > strong {
  font-family: var(--font-display);
  font-size: 0.95rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.any {
  opacity: 0.6;
}

.row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
  margin-top: 0.4rem;
}
</style>
