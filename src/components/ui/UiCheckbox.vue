<script setup lang="ts">
const model = defineModel<boolean>({ default: false })
</script>

<template>
  <!-- Native checkbox tinted with accent-color; wrap it in a <label> for the text. -->
  <input v-model="model" type="checkbox" class="ui-checkbox" />
</template>

<style scoped>
.ui-checkbox {
  width: 1.1rem;
  height: 1.1rem;
  margin: 0;
  accent-color: var(--primary);
  cursor: pointer;
}

.ui-checkbox:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
}
</style>
