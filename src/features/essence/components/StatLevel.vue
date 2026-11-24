<script setup lang="ts">
import { computed } from 'vue'
import type { Slot } from '@/types/data'

/**
 * Essence stat level in the in-game "Essence Stats" style:
 * a bulleted name row with a hairline rule, then a pill track of slanted segments and a "+N" readout.
 * Click a segment to set that level (click the top filled one again to step down); arrow keys work on the track.
 */
const props = defineProps<{
  name: string
  /** Which essence slot this is; picks the bullet colour. */
  tone: Slot
  modelValue: number
  min: number
  max: number
  disabled?: boolean
  /** Slot meaning, e.g. "Primary"; used in the tooltip and accessible name. */
  slotLabel?: string
}>()

const emit = defineEmits<{ 'update:modelValue': [value: number] }>()

const maxed = computed(() => !props.disabled && props.modelValue >= props.max)
const label = computed(() => (props.slotLabel ? `${props.slotLabel}: ${props.name}` : props.name))

function set(value: number) {
  if (props.disabled) return
  const next = Math.min(props.max, Math.max(props.min, value))
  if (next !== props.modelValue) emit('update:modelValue', next)
}

/** Clicking the current top segment steps down one; any other segment jumps to it. */
function onSegment(n: number) {
  set(n === props.modelValue ? n - 1 : n)
}

function onKey(e: KeyboardEvent) {
  const actions: Record<string, () => void> = {
    ArrowLeft: () => set(props.modelValue - 1),
    ArrowDown: () => set(props.modelValue - 1),
    ArrowRight: () => set(props.modelValue + 1),
    ArrowUp: () => set(props.modelValue + 1),
    Home: () => set(props.min),
    End: () => set(props.max),
  }
  const action = actions[e.key]
  if (!action) return
  e.preventDefault()
  action()
}
</script>

<template>
  <div class="stat-level" :class="[tone, { off: disabled, maxed }]" :title="label">
    <div class="head">
      <span class="bullet" aria-hidden="true" />
      <span class="name">{{ name }}</span>
      <span class="rule" aria-hidden="true" />
    </div>
    <div class="body">
      <div
        class="track"
        role="slider"
        :tabindex="disabled ? -1 : 0"
        :aria-label="label"
        :aria-valuemin="min"
        :aria-valuemax="max"
        :aria-valuenow="modelValue"
        :aria-disabled="disabled || undefined"
        @keydown="onKey"
      >
        <span
          v-for="n in max"
          :key="n"
          class="seg"
          :class="{ on: n <= modelValue }"
          aria-hidden="true"
          @click="onSegment(n)"
        />
      </div>
      <span class="divider" aria-hidden="true" />
      <span class="readout">{{ maxed ? 'MAX' : `+${modelValue}` }}</span>
    </div>
  </div>
</template>

<style scoped>
.stat-level {
  --tone: var(--slot1-color);
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
}

.stat-level.slot2 {
  --tone: var(--slot2-color);
}

.stat-level.slot3 {
  --tone: var(--slot3-color);
}

.stat-level.off {
  opacity: 0.45;
}

/* ---- Name row: ○ Name ─────────○ ---- */
.head {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  min-width: 0;
}

.bullet {
  flex: none;
  width: 0.5rem;
  height: 0.5rem;
  border: 2px solid var(--tone);
  border-radius: 50%;
}

.name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.9rem;
  font-weight: 500;
}

.rule {
  position: relative;
  flex: 1;
  min-width: 1rem;
  height: 1px;
  margin-right: 0.35rem;
  background: var(--border-strong);
}

/* Small hollow end-cap circle. */
.rule::after {
  content: '';
  position: absolute;
  right: -0.35rem;
  top: -0.17rem;
  width: 0.35rem;
  height: 0.35rem;
  border: 1px solid var(--border-strong);
  border-radius: 50%;
}

/* ---- Track row: ⟨▰▰▱▱⟩ │ +N ---- */
.body {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding-left: 0.1rem;
}

.track {
  display: flex;
  align-items: center;
  gap: 0.2rem;
  /* Hugs its segments: the tube is only as long as the slot's max (at most 6). */
  flex: none;
  height: 1.05rem;
  padding: 0 0.55rem;
  border-radius: 999px;
  background: var(--surface-hover);
  box-shadow: inset 0 0 0 1px var(--border);
  cursor: pointer;
}

.off .track {
  cursor: not-allowed;
}

.track:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
}

.seg {
  flex: none;
  width: 0.95rem;
  height: 0.55rem;
  border: 1px solid var(--border-strong);
  border-radius: 1px;
  transform: skewX(-25deg);
  transition:
    background 0.12s,
    border-color 0.12s,
    box-shadow 0.12s;
}

.seg.on {
  background: var(--primary);
  /* A touch of the text colour keeps the edge visible on the light theme's pale track. */
  border-color: color-mix(in srgb, var(--primary) 75%, var(--text));
}

.stat-level:not(.off) .seg:hover {
  border-color: var(--primary);
}

.maxed .seg.on {
  box-shadow: 0 0 6px color-mix(in srgb, var(--primary) 70%, transparent);
}

.divider {
  flex: none;
  width: 1px;
  height: 1rem;
  /* Pushes the divider and readout to the right edge. */
  margin-left: auto;
  background: var(--border-strong);
}

.readout {
  flex: none;
  min-width: 2.2rem;
  text-align: right;
  font-family: var(--font-mono);
  font-size: 0.95rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--text);
}

.maxed .readout {
  color: var(--green-500);
}
</style>
