<script setup lang="ts">
import { ref } from 'vue'
import type { IconName } from './icons'
import type { Severity } from './types'
import UiIcon from './UiIcon.vue'

withDefaults(
  defineProps<{
    severity?: Severity
    icon?: IconName
    closable?: boolean
  }>(),
  { severity: 'info', icon: undefined, closable: false },
)

const visible = ref(true)
</script>

<template>
  <div v-if="visible" class="ui-message" :class="`tone-${severity}`" :role="severity === 'danger' ? 'alert' : 'status'">
    <UiIcon v-if="icon" :name="icon" class="icon" />
    <div class="content"><slot /></div>
    <button v-if="closable" type="button" class="close" aria-label="Dismiss" @click="visible = false">
      <UiIcon name="times" />
    </button>
  </div>
</template>

<style scoped>
.ui-message {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  padding: 0.6rem 0.8rem;
  border: 1px solid color-mix(in srgb, var(--tone) 35%, transparent);
  border-left: 4px solid var(--tone);
  border-radius: var(--radius);
  background: color-mix(in srgb, var(--tone) 10%, var(--surface));
  color: var(--tone);
}

/* Secondary reads as body text on a neutral panel with the yellow hazard bar. */
.ui-message.tone-secondary {
  color: var(--text);
  border-color: var(--border);
  border-left-color: var(--primary);
  background: var(--surface);
}

.icon {
  margin-top: 0.1rem;
  font-size: 1.1em;
}

.content {
  flex: 1;
  min-width: 0;
}

.content :deep(ul) {
  margin: 0.25rem 0 0;
  padding-left: 1.25rem;
}

.close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  padding: 0;
  border: none;
  border-radius: var(--radius);
  background: transparent;
  color: inherit;
  cursor: pointer;
}

.close:hover {
  background: color-mix(in srgb, var(--tone) 18%, transparent);
}

.close:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 1px;
}
</style>
