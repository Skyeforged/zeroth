import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import {
  defaultOptimizerState,
  OPTIMIZER_SAVE_VERSION,
  parseOptimizerSave,
  type CustomEssence,
  type OptimizerState,
} from '@/features/essence/lib/optimizerSave'
import { loadJson, saveJson } from '@/lib/storage'
import { wrap } from '@/lib/versioned'
import type { FullEssence, Id } from '@/types/data'

export type { CustomEssence } from '@/features/essence/lib/optimizerSave'

/** The save version lives inside the save (`{ version, data }`), not in the key. */
const STORAGE_KEY = 'zeroth:optimizer'

export const useOptimizerStore = defineStore('optimizer', () => {
  const parsed = parseOptimizerSave(loadJson<unknown>(STORAGE_KEY))
  const initial = parsed?.state ?? defaultOptimizerState()

  /** Selected weapon ids. Custom essences are always targets while they exist. */
  const selectedIds = ref<Id[]>(initial.selectedIds)
  /** Ids (weapons or custom essences) marked Priority. */
  const priorityIds = ref<Id[]>(initial.priorityIds)
  /** Ids (weapons or custom essences) with the shield on: only their slot-3 stat matters. */
  const shieldIds = ref<Id[]>(initial.shieldIds)
  const customEssences = ref<CustomEssence[]>(initial.customEssences)
  const hideCompleted = ref(initial.hideCompleted)
  const showPartial = ref(initial.showPartial)

  const snapshot = (): OptimizerState => ({
    selectedIds: selectedIds.value,
    priorityIds: priorityIds.value,
    shieldIds: shieldIds.value,
    customEssences: customEssences.value,
    hideCompleted: hideCompleted.value,
    showPartial: showPartial.value,
  })
  const save = () => saveJson(STORAGE_KEY, wrap(OPTIMIZER_SAVE_VERSION, snapshot()))

  // Write the sanitized save back now (after any migrations), unless it came from a newer app version.
  // Unreadable JSON or a value that is not a save envelope is left untouched.
  if (parsed && !parsed.future) save()

  watch([selectedIds, priorityIds, shieldIds, customEssences, hideCompleted, showPartial], save, { deep: true })

  function isPriority(id: Id): boolean {
    return priorityIds.value.includes(id)
  }

  function togglePriority(id: Id) {
    priorityIds.value = isPriority(id) ? priorityIds.value.filter((x) => x !== id) : [...priorityIds.value, id]
  }

  function isShielded(id: Id): boolean {
    return shieldIds.value.includes(id)
  }

  function toggleShield(id: Id) {
    shieldIds.value = isShielded(id) ? shieldIds.value.filter((x) => x !== id) : [...shieldIds.value, id]
  }

  function addWeapon(id: Id) {
    if (!selectedIds.value.includes(id)) selectedIds.value = [...selectedIds.value, id]
  }

  function removeWeapon(id: Id) {
    selectedIds.value = selectedIds.value.filter((x) => x !== id)
    priorityIds.value = priorityIds.value.filter((x) => x !== id)
    shieldIds.value = shieldIds.value.filter((x) => x !== id)
  }

  function addCustom(name: string, essence: FullEssence) {
    const id = `custom_${Date.now().toString(36)}_${customEssences.value.length}`
    customEssences.value = [...customEssences.value, { id, name: name.trim() || 'Custom essence', essence }]
  }

  function removeCustom(id: Id) {
    customEssences.value = customEssences.value.filter((c) => c.id !== id)
    priorityIds.value = priorityIds.value.filter((x) => x !== id)
    shieldIds.value = shieldIds.value.filter((x) => x !== id)
  }

  function clearAll() {
    selectedIds.value = []
    priorityIds.value = []
    shieldIds.value = []
    customEssences.value = []
  }

  return {
    selectedIds,
    priorityIds,
    shieldIds,
    customEssences,
    hideCompleted,
    showPartial,
    isPriority,
    togglePriority,
    isShielded,
    toggleShield,
    addWeapon,
    removeWeapon,
    addCustom,
    removeCustom,
    clearAll,
  }
})
