import { isPlainObject, migrate, type Migrations } from '@/lib/versioned'
import { SLOTS, type FullEssence, type Id } from '@/types/data'

/** A user-defined target that is not tied to a weapon in the data. */
export interface CustomEssence {
  id: Id
  name: string
  essence: FullEssence
}

/** Persisted optimizer state (the `data` of the save envelope). */
export interface OptimizerState {
  selectedIds: Id[]
  priorityIds: Id[]
  shieldIds: Id[]
  customEssences: CustomEssence[]
  hideCompleted: boolean
  showPartial: boolean
}

/** Current optimizer save version. Bump it and add a migration step when the shape changes. */
export const OPTIMIZER_SAVE_VERSION = 1

/** Migration steps keyed by from-version (none yet). */
export const optimizerMigrations: Migrations = {}

const strings = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x) => typeof x === 'string') : [])

export function defaultOptimizerState(): OptimizerState {
  return {
    selectedIds: [],
    priorityIds: [],
    shieldIds: [],
    customEssences: [],
    hideCompleted: false,
    showPartial: false,
  }
}

export function sanitizeCustom(raw: unknown): CustomEssence | null {
  if (!isPlainObject(raw)) return null
  const r = raw as Partial<CustomEssence>
  if (typeof r.id !== 'string' || typeof r.essence !== 'object' || r.essence === null) return null
  if (!SLOTS.every((s) => typeof r.essence![s] === 'string')) return null
  return {
    id: r.id,
    name: typeof r.name === 'string' && r.name.trim() ? r.name.trim() : 'Custom essence',
    essence: { slot1: r.essence.slot1, slot2: r.essence.slot2, slot3: r.essence.slot3 },
  }
}

/**
 * Parse an optimizer save of any version into current state, filling defaults. `null` = not a save envelope.
 * `future` = saved by a newer app version (best-effort parse; do not write it back on load).
 */
export function parseOptimizerSave(raw: unknown): { state: OptimizerState; future: boolean } | null {
  const migrated = migrate(raw, OPTIMIZER_SAVE_VERSION, optimizerMigrations)
  if (!migrated) return null
  const { data, future } = migrated
  const d = isPlainObject(data) ? data : {}
  return {
    state: {
      selectedIds: strings(d.selectedIds),
      priorityIds: strings(d.priorityIds),
      shieldIds: strings(d.shieldIds),
      customEssences: Array.isArray(d.customEssences)
        ? d.customEssences.map(sanitizeCustom).filter((c): c is CustomEssence => c !== null)
        : [],
      hideCompleted: d.hideCompleted === true,
      showPartial: d.showPartial === true,
    },
    future,
  }
}
