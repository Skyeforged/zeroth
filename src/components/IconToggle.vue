<script setup lang="ts">
import type { IconName } from '@/components/ui/icons'
import UiIcon from '@/components/ui/UiIcon.vue'

withDefaults(
  defineProps<{
    modelValue: boolean
    icon: IconName
    label: string
    tone?: 'success' | 'warn' | 'info'
    disabled?: boolean
  }>(),
  { tone: 'success', disabled: false },
)

defineEmits<{ 'update:modelValue': [value: boolean] }>()
</script>

<template>
  <!-- Native tooltip sits on the wrapper: disabled buttons don't emit hover events. -->
  <span :title="label" class="icon-toggle-wrap">
    <button
      type="button"
      class="icon-toggle"
      :class="[`tone-${tone}`, { on: modelValue }]"
      :aria-pressed="modelValue"
      :aria-label="label"
      :disabled="disabled"
      @click="$emit('update:modelValue', !modelValue)"
    >
      <UiIcon :name="icon" />
    </button>
  </span>
</template>

<style scoped>
.icon-toggle-wrap {
  display: inline-flex;
}

.icon-toggle {
  --tone: var(--green-500);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.6rem;
  height: 1.6rem;
  border: 1px solid transparent;
  border-radius: var(--radius);
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition:
    background 0.15s,
    color 0.15s;
}

.icon-toggle.tone-warn {
  --tone: var(--amber-500);
}

.icon-toggle.tone-info {
  --tone: var(--blue-400);
}

.icon-toggle:hover:not(:disabled) {
  color: var(--tone);
  background: color-mix(in srgb, var(--tone) 10%, transparent);
}

.icon-toggle.on {
  color: var(--tone);
  border-color: color-mix(in srgb, var(--tone) 50%, transparent);
  background: color-mix(in srgb, var(--tone) 20%, transparent);
}

.icon-toggle:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.icon-toggle:focus-visible {
  outline: 2px solid var(--tone);
  outline-offset: 1px;
}
</style>
