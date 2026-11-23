<script setup lang="ts">
import UiTag from '@/components/ui/UiTag.vue'
import { STATUS_LABEL, type WeaponStatus } from '@/lib/status'

defineProps<{ status: WeaponStatus }>()

const severity = { unobtained: 'secondary', obtained: 'info', completed: 'success' } as const
</script>

<template>
  <UiTag :value="STATUS_LABEL[status]" :severity="severity[status]" />
</template>
