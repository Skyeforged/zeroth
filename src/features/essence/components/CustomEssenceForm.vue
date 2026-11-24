<script setup lang="ts">
import { computed, ref } from 'vue'
import UiButton from '@/components/ui/UiButton.vue'
import UiInput from '@/components/ui/UiInput.vue'
import UiSelect from '@/components/ui/UiSelect.vue'
import { stats } from '@/data'
import { nameOf } from '@/lib/i18n'
import type { FullEssence, Id } from '@/types/data'

const emit = defineEmits<{ add: [name: string, essence: FullEssence] }>()

const name = ref('')
const slot1 = ref<Id | null>(null)
const slot2 = ref<Id | null>(null)
const slot3 = ref<Id | null>(null)

const options = (ids: Id[]) => ids.map((id) => ({ value: id, label: nameOf('stats', id) }))
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
    <UiInput v-model="name" placeholder="Name (optional)" aria-label="Name" />
    <UiSelect v-model="slot1" :options="slot1Options" placeholder="Slot 1 (main stat)" aria-label="Slot 1 (main stat)" />
    <UiSelect v-model="slot2" :options="slot2Options" placeholder="Slot 2 (sub stat)" aria-label="Slot 2 (sub stat)" />
    <UiSelect v-model="slot3" :options="slot3Options" placeholder="Slot 3 (skill)" aria-label="Slot 3 (skill)" />
    <UiButton label="Add custom essence" icon="plus" :disabled="!complete" @click="add" />
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
