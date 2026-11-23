<script setup lang="ts">
import { computed, ref } from 'vue'
import CustomEssenceForm from '@/components/CustomEssenceForm.vue'
import AlluviumResultCard from '@/components/AlluviumResultCard.vue'
import TargetCard from '@/components/TargetCard.vue'
import UiButton from '@/components/ui/UiButton.vue'
import UiCheckbox from '@/components/ui/UiCheckbox.vue'
import UiInput from '@/components/ui/UiInput.vue'
import UiMessage from '@/components/ui/UiMessage.vue'
import WeaponTile from '@/components/WeaponTile.vue'
import { alluviums, stats, weapons } from '@/data'
import { essenceSlots, essenceStats } from '@/lib/essence'
import { nameOf } from '@/lib/i18n'
import { rankAlluviums, type Target } from '@/lib/optimizer'
import { deriveStatus } from '@/lib/status'
import { weaponTypeOptions } from '@/lib/weaponTypes'
import { useOptimizerStore } from '@/stores/optimizer'
import { useTrackerStore } from '@/stores/tracker'
import type { Essence } from '@/types/data'

const optimizer = useOptimizerStore()
const tracker = useTrackerStore()

const showAdd = ref(false)
const showCustom = ref(false)
const search = ref('')
/** Weapon type id to filter the picker by; null shows all types. Not persisted. */
const typeFilter = ref<string | null>(null)
const typeOptions = weaponTypeOptions(weapons)

const subtitle = (e: Essence) => essenceStats(e).map((id) => nameOf('stats', id)).join(' / ')

/** Stat names keyed by slot (not zipped by index: a 3-star weapon has no slot 2). */
const slotStats = (e: Essence) => essenceSlots(e).map((slot) => ({ slot, name: nameOf('stats', e[slot]!) }))

/** Every target card: selected weapons first, then custom essences. */
const targets = computed<Target[]>(() => {
  const fromWeapons = optimizer.selectedIds.flatMap((id) => {
    const weapon = weapons.find((w) => w.id === id)
    if (!weapon) return []
    return [
      {
        id: weapon.id,
        label: nameOf('weapons', weapon.id),
        essence: weapon.essence,
        onlySlot3: tracker.get(weapon.id).onlySlot3,
        priority: optimizer.isPriority(weapon.id),
        custom: false,
      },
    ]
  })
  const fromCustom = optimizer.customEssences.map((c) => ({
    id: c.id,
    label: c.name,
    essence: c.essence,
    onlySlot3: c.onlySlot3,
    priority: optimizer.isPriority(c.id),
    custom: true,
  }))
  return [...fromWeapons, ...fromCustom]
})

const addable = computed(() =>
  weapons
    .filter((w) => !optimizer.selectedIds.includes(w.id))
    .map((weapon) => ({
      weapon,
      status: deriveStatus(tracker.get(weapon.id), essenceSlots(weapon.essence)),
      name: nameOf('weapons', weapon.id),
    }))
    // Highest rarity first, then by name.
    .sort((a, b) => (b.weapon.rarity ?? 0) - (a.weapon.rarity ?? 0) || a.name.localeCompare(b.name))
    .filter((c) => !typeFilter.value || c.weapon.type === typeFilter.value)
    .filter((c) => !(optimizer.hideCompleted && c.status === 'completed'))
    .filter((c) => !search.value || c.name.toLowerCase().includes(search.value.toLowerCase())),
)

const results = computed(() => rankAlluviums(targets.value, alluviums, stats.slot1))

function toggleShield(t: Target) {
  if (t.custom) optimizer.setCustomShield(t.id, !t.onlySlot3)
  else tracker.update(t.id, { onlySlot3: !t.onlySlot3 })
}

function remove(t: Target) {
  if (t.custom) optimizer.removeCustom(t.id)
  else optimizer.removeWeapon(t.id)
}

function addAllShown() {
  for (const c of addable.value) optimizer.addWeapon(c.weapon.id)
}

const hasTargets = computed(() => targets.value.length > 0)
</script>

<template>
  <section class="panel">
    <div class="head">
      <h2>Select Your Weapons</h2>
      <UiButton
        :label="`Clear (${targets.length})`"
        icon="times"
        severity="secondary"
        size="small"
        :disabled="!hasTargets"
        @click="optimizer.clearAll()"
      />
    </div>
    <p class="muted">
      Pick the weapons you want to farm essences for. We rank Energy Alluviums by how many perfect matches they can give you,
      assuming you engrave.
    </p>
    <UiMessage severity="secondary" icon="shield">
      Tip: click the shield on a support weapon that only needs its 3rd line (skill) stat. Its main stat then won't
      compete for the engraving picks. Click the star to mark a weapon as Priority (x2 points).
    </UiMessage>

    <div class="cards">
      <TargetCard
        v-for="t in targets"
        :key="t.id"
        :icon-id="t.custom ? undefined : t.id"
        :label="t.label"
        :stats="slotStats(t.essence)"
        :custom="t.custom"
        :priority="t.priority"
        :shield="t.onlySlot3"
        @toggle-priority="optimizer.togglePriority(t.id)"
        @toggle-shield="toggleShield(t)"
        @remove="remove(t)"
      />
    </div>

    <div class="toolbar">
      <UiButton
        label="Add Weapons"
        :icon="showAdd ? 'chevron-up' : 'plus'"
        severity="secondary"
        :aria-expanded="showAdd"
        @click="showAdd = !showAdd"
      />
      <UiButton
        label="Add custom essence"
        :icon="showCustom ? 'chevron-up' : 'plus'"
        severity="secondary"
        :aria-expanded="showCustom"
        @click="showCustom = !showCustom"
      />
    </div>

    <div v-if="showAdd" class="add">
      <div class="toolbar">
        <UiInput v-model="search" placeholder="Search weapon" aria-label="Search weapon" />
        <UiButton
          :label="optimizer.hideCompleted ? 'Completed hidden' : 'Hide completed'"
          :icon="optimizer.hideCompleted ? 'eye-off' : 'eye'"
          :severity="optimizer.hideCompleted ? 'primary' : 'secondary'"
          :aria-pressed="optimizer.hideCompleted"
          @click="optimizer.hideCompleted = !optimizer.hideCompleted"
        />
        <UiButton label="Add all shown" severity="secondary" size="small" @click="addAllShown" />
      </div>
      <div class="types">
        <UiButton
          label="All types"
          size="small"
          :severity="typeFilter === null ? 'primary' : 'secondary'"
          :variant="typeFilter === null ? 'solid' : 'outlined'"
          :aria-pressed="typeFilter === null"
          @click="typeFilter = null"
        />
        <UiButton
          v-for="type in typeOptions"
          :key="type"
          :label="nameOf('weaponTypes', type)"
          size="small"
          :severity="typeFilter === type ? 'primary' : 'secondary'"
          :variant="typeFilter === type ? 'solid' : 'outlined'"
          :aria-pressed="typeFilter === type"
          @click="typeFilter = typeFilter === type ? null : type"
        />
      </div>
      <p v-if="!addable.length" class="muted">
        {{ search || typeFilter || optimizer.hideCompleted ? 'No weapons match the filters.' : 'No more weapons to add.' }}
      </p>
      <div class="grid">
        <WeaponTile
          v-for="c in addable"
          :key="c.weapon.id"
          :weapon-id="c.weapon.id"
          :name="c.name"
          :rarity="c.weapon.rarity"
          :title="`${c.name}: ${subtitle(c.weapon.essence)}`"
          :status="c.status"
          @select="optimizer.addWeapon(c.weapon.id)"
        />
      </div>
    </div>

    <div v-if="showCustom" class="add">
      <p class="muted">Custom essences are saved in this browser with your selection.</p>
      <CustomEssenceForm @add="optimizer.addCustom" />
    </div>
  </section>

  <section class="panel">
    <div class="head">
      <h2>Best Energy Alluviums</h2>
      <label class="check">
        <UiCheckbox v-model="optimizer.showPartial" />
        <span>Show 1/3 and 2/3 matches</span>
      </label>
    </div>
    <p v-if="!hasTargets" class="muted">Select one or more weapons to see which Energy Alluviums suit them best.</p>
    <div v-else class="results">
      <AlluviumResultCard
        v-for="(r, i) in results"
        :key="r.alluviumId"
        :result="r"
        :rank="i + 1"
        :best="i === 0 && r.points > 0"
        :show-partial="optimizer.showPartial"
      />
    </div>
  </section>
</template>

<style scoped>
.panel {
  margin-bottom: 2rem;
}

.head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem 1rem;
  padding-bottom: 0.4rem;
  border-bottom: 1px solid var(--border);
}

h2 {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.45rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

h2::before {
  content: '// ';
  font-family: var(--font-mono);
  font-size: 0.8em;
  color: var(--primary-text);
}

.cards {
  display: grid;
  /* ~20rem leaves room for a long single word in the name next to the icon and the three actions. */
  grid-template-columns: repeat(auto-fill, minmax(min(20rem, 100%), 1fr));
  align-items: start;
  gap: 0.5rem;
  margin: 0.75rem 0;
}

.add {
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  padding: 1rem;
  margin-top: 0.75rem;
}

/* Nested toolbars sit flat inside the panel rather than as a second slab. */
.add .toolbar {
  padding: 0;
  background: none;
  border: none;
}

.types {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin: 0.5rem 0;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 0.5rem;
  max-height: 28rem;
  overflow: auto;
  padding: 0.1rem;
}

.check {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.results {
  display: grid;
  /* Fill wide screens with several Energy Alluvium cards per row; one column on narrow screens. */
  grid-template-columns: repeat(auto-fill, minmax(min(32rem, 100%), 1fr));
  align-items: start;
  gap: 1rem;
  margin-top: 1rem;
}
</style>
