<script setup lang="ts">
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import { computed, ref } from 'vue'
import { stats } from '@/data'
import { nameOf } from '@/lib/i18n'
import type { FullEssence, Id } from '@/types/data'

const emit = defineEmits<{ add: [name: string, essence: FullEssence] }>()

const name = ref('')
const slot1 = ref<Id | null>(null)
const slot2 = ref<Id | null>(null)
const slot3 = ref<Id | null>(null)

const options = (ids: Id[]) => ids.map((id) => ({ id, label: nameOf('stats', id) }))
const slot1Options = computed(() => options(stats.slot1))
const slot2Options = computed(() => options(stats.slot2))
const slot3Options = computed(() => options(stats.slot3))

const complete = computed(() => slot1.value && slot2.value && slot3.value)

function add() {
  if (!slot1.value || !slot2.value || !slot3.value) return
  emit('add', name.value, { slot1: slot1.value, slot2: slot2.value, slot3: slot3.value })
  name.value = ''
  slot1.value = slot2.value = slot3.value = null
}
</script>

<template>
  <div class="form">
    <InputText v-model="name" placeholder="Name (optional)" />
    <Select v-model="slot1" :options="slot1Options" option-label="label" option-value="id" placeholder="Slot 1 (main stat)" filter />
    <Select v-model="slot2" :options="slot2Options" option-label="label" option-value="id" placeholder="Slot 2 (sub stat)" filter />
    <Select v-model="slot3" :options="slot3Options" option-label="label" option-value="id" placeholder="Slot 3 (skill)" filter />
    <Button label="Add custom essence" icon="pi pi-plus" :disabled="!complete" @click="add" />
  </div>
</template>

<style scoped>
.form {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}
</style>
