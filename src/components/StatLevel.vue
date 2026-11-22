<script setup lang="ts">
import type { Slot } from '@/types/data'

const props = defineProps<{
  name: string
  /** Which essence slot this is; picks the badge colour. */
  tone: Slot
  modelValue: number
  min: number
  max: number
  disabled?: boolean
}>()

const emit = defineEmits<{ 'update:modelValue': [value: number] }>()

function step(delta: number) {
  const next = Math.min(props.max, Math.max(props.min, props.modelValue + delta))
  if (next !== props.modelValue) emit('update:modelValue', next)
}
</script>

<template>
  <span class="badge" :class="[tone, { off: disabled, maxed: !disabled && modelValue >= max }]">
    <span class="name" :title="name">{{ name }}</span>
    <span class="stepper">
      <button
        type="button"
        class="step"
        aria-label="Decrease"
        :disabled="disabled || modelValue <= min"
        @click="step(-1)"
      >
        <i class="pi pi-minus" />
      </button>
      <span class="level"><strong>{{ modelValue }}</strong>/{{ max }}</span>
      <button
        type="button"
        class="step"
        aria-label="Increase"
        :disabled="disabled || modelValue >= max"
        @click="step(1)"
      >
        <i class="pi pi-plus" />
      </button>
    </span>
  </span>
</template>

<style scoped>
.badge {
  --tone: var(--p-blue-400);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  min-width: 0;
  padding: 0.1rem 0.15rem 0.1rem 0.5rem;
  border: 1px solid color-mix(in srgb, var(--tone) 45%, transparent);
  border-radius: 6px;
  background: color-mix(in srgb, var(--tone) 14%, transparent);
  color: var(--tone);
  font-weight: 600;
  font-size: 0.85rem;
}

.badge.slot1 {
  --tone: var(--slot1-color);
}

.badge.slot2 {
  --tone: var(--slot2-color);
}

.badge.slot3 {
  --tone: var(--slot3-color);
}

/* Max level: finished slots turn green. */
.badge.maxed {
  --tone: var(--p-green-400);
}

.badge.off {
  opacity: 0.5;
}

.name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.stepper {
  flex: none;
  display: inline-flex;
  align-items: center;
}

.level {
  min-width: 1.9rem;
  text-align: center;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  font-weight: 400;
  font-size: 0.8rem;
  color: var(--p-text-muted-color);
}

.level strong {
  color: var(--tone);
  font-weight: 700;
}

.step {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  padding: 0;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--tone);
  font-size: 0.6rem;
  cursor: pointer;
}

.step:hover:not(:disabled) {
  background: color-mix(in srgb, var(--tone) 28%, transparent);
}

.step:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
</style>
