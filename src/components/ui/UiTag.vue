<script setup lang="ts">
import type { Severity } from './types'

withDefaults(defineProps<{ value: string; severity?: Severity }>(), { severity: 'primary' })
</script>

<template>
  <span class="ui-tag" :class="`tone-${severity}`">{{ value }}</span>
</template>

<style scoped>
.ui-tag {
  display: inline-flex;
  align-items: center;
  padding: 0.15rem 0.4rem;
  border: 1px solid color-mix(in srgb, var(--tone) 45%, transparent);
  border-radius: var(--radius);
  background: color-mix(in srgb, var(--tone) 14%, transparent);
  color: var(--tone);
  font-family: var(--font-mono);
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  line-height: 1.2;
  white-space: nowrap;
}
</style>
