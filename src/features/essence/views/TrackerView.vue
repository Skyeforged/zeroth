<script setup lang="ts">
import { computed, ref } from 'vue'
import TrackerCard from '@/features/essence/components/TrackerCard.vue'
import UiButton from '@/components/ui/UiButton.vue'
import UiInput from '@/components/ui/UiInput.vue'
import UiMessage from '@/components/ui/UiMessage.vue'
import UiSelect from '@/components/ui/UiSelect.vue'
import { weapons } from '@/data'
import { nameOf } from '@/lib/i18n'
import { deriveStatus, STATUS_LABEL, type WeaponStatus } from '@/features/essence/lib/tracker'
import { useTrackerStore } from '@/features/essence/stores/tracker'
import type { Slot } from '@/types/data'

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
        status: deriveStatus(progress),
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
  for (const w of weapons) counts[deriveStatus(tracker.get(w.id))]++
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
    <UiInput v-model="search" placeholder="Search weapon" aria-label="Search weapon" />
    <UiSelect
      v-model="statusFilter"
      :options="statusOptions"
      placeholder="All statuses"
      aria-label="Filter by status"
      clearable
    />
    <span class="readout">
      // {{ summary.unobtained }} unobtained · {{ summary.obtained }} obtained · {{ summary.completed }} completed
    </span>
    <span class="spacer" />
    <UiButton label="Export" icon="download" severity="secondary" @click="download" />
    <UiButton label="Import" icon="upload" severity="secondary" @click="fileInput?.click()" />
    <UiButton label="Reset" icon="trash" severity="danger" variant="text" @click="confirmReset" />
    <input ref="fileInput" type="file" accept="application/json,.json" hidden @change="onImport" />
  </div>
  <UiMessage v-if="importError" severity="danger" icon="times-circle" class="import-error">
    {{ importError }}
  </UiMessage>

  <div class="card-grid">
    <TrackerCard
      v-for="r in rows"
      :key="r.weapon.id"
      :weapon-id="r.weapon.id"
      :name="r.name"
      :rarity="r.weapon.rarity"
      :essence="r.weapon.essence"
      :progress="r.progress"
      :status="r.status"
      :slot-labels="slotLabel"
      @level="(slot, v) => tracker.setLevel(r.weapon.id, slot, v)"
      @update="(patch) => tracker.update(r.weapon.id, patch)"
    />
    <p v-if="!rows.length" class="empty">No weapons match the current filters.</p>
  </div>
</template>

<style scoped>
.card-grid {
  display: grid;
  /* ~19rem leaves room for a 15-character word in the card name before it has to break. */
  grid-template-columns: repeat(auto-fill, minmax(min(19rem, 100%), 1fr));
  gap: 0.6rem;
}

.spacer {
  flex: 1;
}

.empty {
  grid-column: 1 / -1;
  margin: 0;
  padding: 1rem 0.5rem;
  color: var(--text-muted);
}

.import-error {
  margin-bottom: 0.75rem;
}
</style>
