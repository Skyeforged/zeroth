<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    icon: string
    label: string
    /** Tooltip shown instead of `label` while disabled. */
    disabledHint?: string
    tone?: 'success' | 'warn' | 'info'
    disabled?: boolean
  }>(),
  { tone: 'success', disabled: false, disabledHint: undefined },
)

defineEmits<{ 'update:modelValue': [value: boolean] }>()

const tip = computed(() => (props.disabled && props.disabledHint ? props.disabledHint : props.label))
</script>

<template>
  <!-- Tooltip sits on the wrapper: disabled buttons don't emit hover events. -->
  <span v-tooltip.top="tip" class="icon-toggle-wrap">
    <button
      type="button"
      class="icon-toggle"
      :class="[`tone-${tone}`, { on: modelValue }]"
      :aria-pressed="modelValue"
      :aria-label="label"
      :disabled="disabled"
      @click="$emit('update:modelValue', !modelValue)"
    >
      <i :class="icon" />
    </button>
  </span>
</template>

<style scoped>
.icon-toggle-wrap {
  display: inline-flex;
}

.icon-toggle {
  --tone: var(--p-green-500);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.6rem;
  height: 1.6rem;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--p-text-muted-color);
  cursor: pointer;
  transition:
    background 0.15s,
    color 0.15s;
}

.icon-toggle.tone-warn {
  --tone: var(--p-amber-500);
}

.icon-toggle.tone-info {
  --tone: var(--p-blue-400);
}

.icon-toggle:hover:not(:disabled) {
  color: var(--tone);
  background: color-mix(in srgb, var(--tone) 10%, transparent);
}

.icon-toggle.on {
  color: var(--tone);
  background: color-mix(in srgb, var(--tone) 22%, transparent);
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
