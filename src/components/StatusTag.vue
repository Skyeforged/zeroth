<script setup lang="ts">
import Tag from 'primevue/tag'
import { STATUS_LABEL, type WeaponStatus } from '@/lib/status'

defineProps<{ status: WeaponStatus }>()

const severity = { unobtained: 'secondary', obtained: 'info', completed: 'success' } as const
</script>

<template>
  <Tag :value="STATUS_LABEL[status]" :severity="severity[status]" />
</template>
