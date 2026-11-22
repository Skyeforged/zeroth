import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { loadJson, saveJson } from '@/lib/storage'
import { SLOTS, type FullEssence, type Id } from '@/types/data'

const STORAGE_KEY = 'zeroth:optimizer:v2'

/** A user-defined target that is not tied to a weapon in the data. */
export interface CustomEssence {
  id: Id
  name: string
  essence: FullEssence
  onlySlot3: boolean
}

interface Persisted {
  selectedIds: Id[]
  priorityIds: Id[]
  customEssences: CustomEssence[]
  hideCompleted: boolean
  showPartial: boolean
}

const strings = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x) => typeof x === 'string') : [])

function sanitizeCustom(raw: unknown): CustomEssence | null {
  if (typeof raw !== 'object' || raw === null) return null
  const r = raw as Partial<CustomEssence>
  if (typeof r.id !== 'string' || typeof r.essence !== 'object' || r.essence === null) return null
  if (!SLOTS.every((s) => typeof r.essence![s] === 'string')) return null
  return {
    id: r.id,
    name: typeof r.name === 'string' && r.name.trim() ? r.name.trim() : 'Custom essence',
    essence: { slot1: r.essence.slot1, slot2: r.essence.slot2, slot3: r.essence.slot3 },
    onlySlot3: r.onlySlot3 === true,
  }
}

export const useOptimizerStore = defineStore('optimizer', () => {
  const saved = loadJson<Partial<Persisted>>(STORAGE_KEY)

  /** Selected weapon ids. Custom essences are always targets while they exist. */
  const selectedIds = ref<Id[]>(strings(saved?.selectedIds))
  /** Ids (weapons or custom essences) marked Priority. */
  const priorityIds = ref<Id[]>(strings(saved?.priorityIds))
  const customEssences = ref<CustomEssence[]>(
    Array.isArray(saved?.customEssences)
      ? saved.customEssences.map(sanitizeCustom).filter((c): c is CustomEssence => c !== null)
      : [],
  )
  const hideCompleted = ref(saved?.hideCompleted === true)
  const showPartial = ref(saved?.showPartial === true)

  watch(
    [selectedIds, priorityIds, customEssences, hideCompleted, showPartial],
    () =>
      saveJson(STORAGE_KEY, {
        selectedIds: selectedIds.value,
        priorityIds: priorityIds.value,
        customEssences: customEssences.value,
        hideCompleted: hideCompleted.value,
        showPartial: showPartial.value,
      } satisfies Persisted),
    { deep: true },
  )

  function isPriority(id: Id): boolean {
    return priorityIds.value.includes(id)
  }

  function togglePriority(id: Id) {
    priorityIds.value = isPriority(id) ? priorityIds.value.filter((x) => x !== id) : [...priorityIds.value, id]
  }

  function addWeapon(id: Id) {
    if (!selectedIds.value.includes(id)) selectedIds.value = [...selectedIds.value, id]
  }

  function removeWeapon(id: Id) {
    selectedIds.value = selectedIds.value.filter((x) => x !== id)
    priorityIds.value = priorityIds.value.filter((x) => x !== id)
  }

  function addCustom(name: string, essence: FullEssence) {
    const id = `custom_${Date.now().toString(36)}_${customEssences.value.length}`
    customEssences.value = [
      ...customEssences.value,
      { id, name: name.trim() || 'Custom essence', essence, onlySlot3: false },
    ]
  }

  function removeCustom(id: Id) {
    customEssences.value = customEssences.value.filter((c) => c.id !== id)
    priorityIds.value = priorityIds.value.filter((x) => x !== id)
  }

  function setCustomShield(id: Id, value: boolean) {
    const c = customEssences.value.find((x) => x.id === id)
    if (c) c.onlySlot3 = value
  }

  function clearAll() {
    selectedIds.value = []
    priorityIds.value = []
    customEssences.value = []
  }

  return {
    selectedIds,
    priorityIds,
    customEssences,
    hideCompleted,
    showPartial,
    isPriority,
    togglePriority,
    addWeapon,
    removeWeapon,
    addCustom,
    removeCustom,
    setCustomShield,
    clearAll,
  }
})
