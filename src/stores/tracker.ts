import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { loadJson, saveJson } from '@/lib/storage'
import { defaultProgress, sanitizeProgress, type WeaponProgress } from '@/lib/status'
import type { Id } from '@/types/data'

const STORAGE_KEY = 'zeroth:tracker:v1'

export const useTrackerStore = defineStore('tracker', () => {
  /** Only weapons the user has touched are stored; everything else is the default. */
  const progress = ref<Record<Id, WeaponProgress>>({})

  const saved = loadJson<Record<Id, unknown>>(STORAGE_KEY)
  if (saved && typeof saved === 'object') {
    for (const [id, raw] of Object.entries(saved)) progress.value[id] = sanitizeProgress(raw)
  }

  watch(progress, (value) => saveJson(STORAGE_KEY, value), { deep: true })

  function get(id: Id): WeaponProgress {
    return progress.value[id] ?? defaultProgress()
  }

  function update(id: Id, patch: Partial<Omit<WeaponProgress, 'levels'>>) {
    const next = { ...get(id), ...patch }
    // Marking completed implies obtained; an unobtained weapon cannot stay completed.
    if (patch.completedOverride === true) next.obtained = true
    else if (patch.obtained === false) next.completedOverride = false
    progress.value[id] = sanitizeProgress(next)
  }

  function setLevel(id: Id, slot: keyof WeaponProgress['levels'], level: number) {
    const current = get(id)
    progress.value[id] = sanitizeProgress({ ...current, levels: { ...current.levels, [slot]: level } })
  }

  function exportJson(): string {
    return JSON.stringify(progress.value, null, 2)
  }

  /** Replace all progress with imported JSON. Throws on invalid JSON. */
  function importJson(text: string) {
    const parsed: unknown = JSON.parse(text)
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      throw new Error('Expected a JSON object keyed by weapon id')
    }
    const next: Record<Id, WeaponProgress> = {}
    for (const [id, raw] of Object.entries(parsed)) next[id] = sanitizeProgress(raw)
    progress.value = next
  }

  function reset() {
    progress.value = {}
  }

  return { progress, get, update, setLevel, exportJson, importJson, reset }
})
