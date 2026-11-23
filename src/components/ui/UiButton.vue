<script setup lang="ts">
import { computed, useSlots } from 'vue'
import type { IconName } from './icons'
import type { Severity } from './types'
import UiIcon from './UiIcon.vue'

const props = withDefaults(
  defineProps<{
    label?: string
    icon?: IconName
    severity?: Severity
    /** `solid` fills with the tone; `outlined` draws only a border; `text` has neither. */
    variant?: 'solid' | 'outlined' | 'text'
    size?: 'normal' | 'small'
    disabled?: boolean
    type?: 'button' | 'submit' | 'reset'
  }>(),
  { label: undefined, icon: undefined, severity: 'primary', variant: 'solid', size: 'normal', disabled: false, type: 'button' },
)

const slots = useSlots()
const iconOnly = computed(() => !props.label && !slots.default)
</script>

<template>
  <!-- click, aria-label and aria-pressed fall through to the native button. -->
  <button
    :type="type"
    class="ui-button"
    :class="[`tone-${severity}`, variant, size, { 'icon-only': iconOnly }]"
    :disabled="disabled"
  >
    <UiIcon v-if="icon" :name="icon" />
    <span v-if="label">{{ label }}</span>
    <slot />
  </button>
</template>

<style scoped>
/* Industrial button: square, condensed uppercase label; solid buttons get a chamfered bottom-right corner. */
.ui-button {
  --fill: var(--tone-fill, var(--tone));
  --cut-size: var(--cut);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  padding: 0.45rem 0.85rem;
  border: 1px solid var(--fill);
  border-radius: var(--radius);
  background: var(--fill);
  color: var(--on-tone);
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  line-height: 1.2;
  white-space: nowrap;
  cursor: pointer;
  transition:
    background 0.15s,
    border-color 0.15s,
    color 0.15s;
}

.ui-button.solid {
  clip-path: polygon(0 0, 100% 0, 100% calc(100% - var(--cut-size)), calc(100% - var(--cut-size)) 100%, 0 100%);
}

.ui-button.small {
  --cut-size: 5px;
  padding: 0.3rem 0.6rem;
  font-size: 0.875rem;
}

.ui-button.icon-only {
  padding: 0.5rem;
}

.ui-button.icon-only.small {
  padding: 0.35rem;
}

.ui-button:hover:not(:disabled) {
  background: color-mix(in srgb, var(--fill) 85%, black);
  border-color: color-mix(in srgb, var(--fill) 85%, black);
}

.ui-button.outlined {
  background: transparent;
  color: var(--tone);
  border-color: color-mix(in srgb, var(--tone) 55%, transparent);
}

.ui-button.text {
  background: transparent;
  color: var(--tone);
  border-color: transparent;
}

.ui-button.outlined:hover:not(:disabled),
.ui-button.text:hover:not(:disabled) {
  background: color-mix(in srgb, var(--tone) 12%, transparent);
}

.ui-button.outlined:hover:not(:disabled) {
  border-color: var(--tone);
}

.ui-button.text:hover:not(:disabled) {
  border-color: transparent;
}

/* Secondary solid is a neutral slab rather than a filled accent. */
.ui-button.tone-secondary.solid {
  background: var(--surface-hover);
  border-color: var(--border-strong);
  color: var(--text);
}

.ui-button.tone-secondary.solid:hover:not(:disabled) {
  background: var(--border);
  border-color: var(--primary);
}

.ui-button.tone-secondary.outlined {
  border-color: var(--border-strong);
}

.ui-button.tone-secondary.outlined:hover:not(:disabled) {
  color: var(--text);
}

.ui-button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.ui-button:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
}

/* clip-path would hide an outside ring on solid buttons, so draw it inside in the label colour. */
.ui-button.solid:focus-visible {
  outline-color: currentColor;
  outline-offset: -4px;
}
</style>
