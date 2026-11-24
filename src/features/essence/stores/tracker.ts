import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { defaultProgress, sanitizeProgress, type WeaponProgress } from '@/features/essence/lib/tracker'
import { parseTrackerSave, TRACKER_SAVE_VERSION } from '@/features/essence/lib/trackerSave'
import { loadJson, saveJson } from '@/lib/storage'
import { wrap } from '@/lib/versioned'
import type { Id } from '@/types/data'

/** The save version lives inside the save (`{ version, data }`), not in the key. */
const STORAGE_KEY = 'zeroth:tracker'

export const useTrackerStore = defineStore('tracker', () => {
  /** Only obtained weapons have a record; a missing record means unobtained. */
  const progress = ref<Record<Id, WeaponProgress>>({})

  const save = () => saveJson(STORAGE_KEY, wrap(TRACKER_SAVE_VERSION, progress.value))

  // Write the sanitized save back now (after any migrations), unless it came from a newer app version.
  // Unreadable JSON or a value that is not a save envelope is left untouched.
  const parsed = parseTrackerSave(loadJson<unknown>(STORAGE_KEY))
  if (parsed) {
    progress.value = parsed.progress
    if (!parsed.future) save()
  }

  watch(progress, save, { deep: true })

  /** `undefined` means the weapon is not obtained. */
  function get(id: Id): WeaponProgress | undefined {
    return progress.value[id]
  }

  /**
   * `obtained: false` deletes the record (levels and completed are discarded).
   * Anything else creates the record if missing (marking completed implies obtained), then applies `completed`.
   */
  function update(id: Id, patch: { obtained?: boolean; completed?: boolean }) {
    if (patch.obtained === false) {
      delete progress.value[id]
      return
    }
    const next = { ...(get(id) ?? defaultProgress()) }
    if (patch.completed !== undefined) next.completed = patch.completed
    progress.value[id] = sanitizeProgress(next)!
  }

  /** No-op for unobtained weapons (no record). */
  function setLevel(id: Id, slot: keyof WeaponProgress['levels'], level: number) {
    const current = get(id)
    if (!current) return
    progress.value[id] = sanitizeProgress({ ...current, levels: { ...current.levels, [slot]: level } })!
  }

  /** Export in the versioned envelope `{ version, data }`. */
  function exportJson(): string {
    return JSON.stringify(wrap(TRACKER_SAVE_VERSION, progress.value), null, 2)
  }

  /** Replace all progress with an exported save. Throws on invalid JSON or a non-save file. */
  function importJson(text: string) {
    const parsed = parseTrackerSave(JSON.parse(text))
    if (!parsed) throw new Error('Not a tracker save file (missing version)')
    progress.value = parsed.progress
  }

  function reset() {
    progress.value = {}
  }

  return { progress, get, update, setLevel, exportJson, importJson, reset }
})
