<script setup lang="ts">
import { computed } from 'vue'
import StatChip from '@/components/StatChip.vue'
import { ENGRAVING_MAIN_PICKS } from '@/lib/constants'
import { nameOf } from '@/lib/i18n'
import type { Engraving, Lock } from '@/lib/optimizer'

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
    <strong><i class="pi pi-lock" /> Recommended Pre-Engrave</strong>
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
  border-top: 1px solid var(--p-content-border-color);
  margin-top: 0.75rem;
  padding-top: 0.75rem;
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
