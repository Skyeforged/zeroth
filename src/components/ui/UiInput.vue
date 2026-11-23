<script setup lang="ts">
const model = defineModel<string>({ default: '' })
</script>

<template>
  <!-- placeholder, aria-* and other attributes fall through to the native input. -->
  <input v-model="model" type="text" class="ui-control" />
</template>
