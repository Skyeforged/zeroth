<script setup lang="ts" generic="T extends string">
import type { SelectOption } from './types'
import UiIcon from './UiIcon.vue'

// Attrs (aria-label, etc.) belong on the <select>, not the wrapper.
defineOptions({ inheritAttrs: false })

const model = defineModel<T | null>({ default: null })

withDefaults(
  defineProps<{
    options: SelectOption<T>[]
    placeholder?: string
    /** Lets the user pick the placeholder again to reset the value to null. */
    clearable?: boolean
  }>(),
  { placeholder: 'Select…', clearable: false },
)
</script>

<template>
  <span class="ui-select-wrap">
    <!-- Native select: keyboard, type-ahead and mobile pickers work out of the box. -->
    <select
      v-bind="$attrs"
      v-model="model"
      class="ui-control ui-select"
      :class="{ empty: model === null }"
    >
      <option :value="null" :disabled="!clearable" :hidden="!clearable">{{ placeholder }}</option>
      <option v-for="o in options" :key="o.value" :value="o.value">{{ o.label }}</option>
    </select>
    <UiIcon name="chevron-down" class="arrow" />
  </span>
</template>

<style scoped>
.ui-select-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.ui-select {
  appearance: none;
  width: 100%;
  /* Room for the chevron so long labels never run under it. */
  padding-right: 2.25rem;
  cursor: pointer;
}

.ui-select.empty {
  color: var(--text-muted);
}

.ui-select option {
  color: var(--text);
  background: var(--surface);
}

.arrow {
  position: absolute;
  right: 0.75rem;
  color: var(--text-muted);
  pointer-events: none;
}
</style>
