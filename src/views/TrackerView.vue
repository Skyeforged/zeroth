<script setup lang="ts">
import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import Select from 'primevue/select'
import { computed, ref } from 'vue'
import IconToggle from '@/components/IconToggle.vue'
import StatLevel from '@/components/StatLevel.vue'
import WeaponIcon from '@/components/WeaponIcon.vue'
import { weapons } from '@/data'
import { LEVEL_MAX, LEVEL_MIN } from '@/lib/constants'
import { essenceSlots } from '@/lib/essence'
import { nameOf } from '@/lib/i18n'
import { deriveStatus, STATUS_LABEL, type WeaponStatus } from '@/lib/status'
import { useTrackerStore } from '@/stores/tracker'
import { SLOTS, type Slot } from '@/types/data'

const tracker = useTrackerStore()

const search = ref('')
const statusFilter = ref<WeaponStatus | null>(null)
const importError = ref('')
const fileInput = ref<HTMLInputElement | null>(null)

const statusOptions = (Object.keys(STATUS_LABEL) as WeaponStatus[]).map((value) => ({
  value,
  label: STATUS_LABEL[value],
}))

const slotLabel: Record<Slot, string> = { slot1: 'Primary', slot2: 'Secondary', slot3: 'Skill' }

/** Fixed order (no user sorting): rarity (highest first), then name. */
const rows = computed(() =>
  weapons
    .map((weapon) => {
      const progress = tracker.get(weapon.id)
      return {
        weapon,
        progress,
        status: deriveStatus(progress, essenceSlots(weapon.essence)),
        name: nameOf('weapons', weapon.id),
        rarity: weapon.rarity ?? 0,
      }
    })
    .filter((r) => !statusFilter.value || r.status === statusFilter.value)
    .filter((r) => !search.value || r.name.toLowerCase().includes(search.value.toLowerCase()))
    .sort((a, b) => b.rarity - a.rarity || a.name.localeCompare(b.name)),
)

const summary = computed(() => {
  const counts: Record<WeaponStatus, number> = { unobtained: 0, obtained: 0, completed: 0 }
  for (const w of weapons) counts[deriveStatus(tracker.get(w.id), essenceSlots(w.essence))]++
  return counts
})

function download() {
  const blob = new Blob([tracker.exportJson()], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'essence-progress.json'
  a.click()
  URL.revokeObjectURL(url)
}

async function onImport(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  importError.value = ''
  try {
    tracker.importJson(await file.text())
  } catch (e) {
    importError.value = `Import failed: ${e instanceof Error ? e.message : String(e)}`
  }
}

function confirmReset() {
  if (window.confirm('Reset all tracked progress? This cannot be undone.')) tracker.reset()
}
</script>

<template>
  <div class="toolbar">
    <InputText v-model="search" placeholder="Search weapon" />
    <Select
      v-model="statusFilter"
      :options="statusOptions"
      option-label="label"
      option-value="value"
      placeholder="All statuses"
      show-clear
    />
    <span class="muted">
      {{ summary.unobtained }} unobtained · {{ summary.obtained }} obtained · {{ summary.completed }} completed
    </span>
    <span style="flex: 1" />
    <Button label="Export" icon="pi pi-download" severity="secondary" @click="download" />
    <Button label="Import" icon="pi pi-upload" severity="secondary" @click="fileInput?.click()" />
    <Button label="Reset" icon="pi pi-trash" severity="danger" text @click="confirmReset" />
    <input ref="fileInput" type="file" accept="application/json,.json" hidden @change="onImport" />
  </div>
  <Message v-if="importError" severity="error">{{ importError }}</Message>

  <DataTable :value="rows" data-key="weapon.id" size="small" striped-rows class="tracker-table">
    <Column header="Weapon" style="width: 16rem">
      <template #body="{ data }">
        <div class="weapon-cell">
          <WeaponIcon :weapon-id="data.weapon.id" :size="28" />
          <span>{{ data.name }}</span>
        </div>
      </template>
    </Column>
    <Column>
      <template #header>
        <div class="essence-grid">
          <span v-for="slot in SLOTS" :key="slot" class="slot-head" :class="slot">{{ slotLabel[slot] }}</span>
        </div>
      </template>
      <template #body="{ data }">
        <div class="essence-grid">
          <template v-for="slot in SLOTS" :key="slot">
            <!-- 3-star weapons have no slot-2 sub stat -->
            <span v-if="data.weapon.essence[slot] === undefined" class="muted">n/a</span>
            <StatLevel
              v-else
              :name="nameOf('stats', data.weapon.essence[slot])"
              :tone="slot"
              :model-value="data.progress.levels[slot]"
              :min="LEVEL_MIN"
              :max="LEVEL_MAX[slot]"
              :disabled="!data.progress.obtained"
              @update:model-value="(v: number) => tracker.setLevel(data.weapon.id, slot, v)"
            />
          </template>
        </div>
      </template>
    </Column>
    <Column header="Flags" style="width: 6rem">
      <template #body="{ data }">
        <div class="flags">
          <IconToggle
            icon="pi pi-box"
            label="Obtained"
            tone="info"
            :model-value="data.progress.obtained"
            @update:model-value="(v: boolean) => tracker.update(data.weapon.id, { obtained: v })"
          />
          <IconToggle
            icon="pi pi-check-circle"
            label="Mark completed"
            tone="success"
            :model-value="data.progress.completedOverride"
            @update:model-value="(v: boolean) => tracker.update(data.weapon.id, { completedOverride: v })"
          />
        </div>
      </template>
    </Column>
    <template #empty>No weapons match the current filters.</template>
  </DataTable>
</template>

<style scoped>
.weapon-cell {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.essence-grid {
  display: grid;
  /* Header and row grids share the same column width, so equal tracks keep them aligned.
     Tracks shrink on narrow screens; the table scrolls horizontally below their minimum. */
  grid-template-columns: repeat(3, minmax(10rem, 1fr));
  gap: 0.75rem;
  align-items: center;
}

.slot-head {
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-size: 0.8rem;
  font-weight: 700;
}

.slot-head.slot1 {
  color: var(--slot1-color);
}

.slot-head.slot2 {
  color: var(--slot2-color);
}

.slot-head.slot3 {
  color: var(--slot3-color);
}

.flags {
  display: flex;
  gap: 0.125rem;
}

/* PrimeVue's flex header wrapper would otherwise shrink the header grid. */
.tracker-table :deep(.p-datatable-column-header-content) {
  display: block;
}

.tracker-table :deep(.p-datatable-table-container) {
  overflow-x: auto;
}

.tracker-table :deep(.p-datatable-thead > tr > th),
.tracker-table :deep(.p-datatable-tbody > tr > td) {
  padding: 0.25rem 0.5rem;
}
</style>
