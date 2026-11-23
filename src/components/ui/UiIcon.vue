<script setup lang="ts">
import { ICONS, type IconName } from './icons'

defineProps<{ name: IconName }>()
</script>

<template>
  <!-- Sized 1em so it follows the surrounding font-size, like an icon font. Decorative: label the parent control. -->
  <!-- eslint-disable-next-line vue/no-v-html -- static, trusted markup from icons.ts -->
  <svg
    class="ui-icon"
    viewBox="0 0 24 24"
    width="1em"
    height="1em"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
    v-html="ICONS[name]"
  />
</template>

<style scoped>
.ui-icon {
  flex: none;
  display: inline-block;
  vertical-align: -0.125em;
}
</style>
