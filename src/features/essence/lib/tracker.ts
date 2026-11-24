import { LEVEL_MAX, LEVEL_MIN } from '@/features/essence/lib/constants'
import { isPlainObject } from '@/lib/versioned'
import { SLOTS, type Slot } from '@/types/data'

export type WeaponStatus = 'unobtained' | 'obtained' | 'completed'

/** Progress of an obtained weapon. Unobtained weapons have no record at all. */
export interface WeaponProgress {
  levels: Record<Slot, number>
  /** Marked completed by the user. The only way to be completed (maxed levels do not complete). */
  completed: boolean
}

/** The record created when a weapon is first obtained. */
export function defaultProgress(): WeaponProgress {
  return {
    levels: { slot1: LEVEL_MIN, slot2: LEVEL_MIN, slot3: LEVEL_MIN },
    completed: false,
  }
}

/** `undefined` (no record) means the weapon is not obtained. */
export function deriveStatus(p: WeaponProgress | undefined): WeaponStatus {
  if (!p) return 'unobtained'
  if (p.completed) return 'completed'
  return 'obtained'
}

export const STATUS_LABEL: Record<WeaponStatus, string> = {
  unobtained: 'Unobtained',
  obtained: 'Obtained',
  completed: 'Completed',
}

export function clampLevel(slot: Slot, value: number): number {
  if (!Number.isFinite(value)) return LEVEL_MIN
  return Math.min(LEVEL_MAX[slot], Math.max(LEVEL_MIN, Math.round(value)))
}

/** Repair an untrusted record into a valid one. Returns `null` for anything that is not an object. */
export function sanitizeProgress(raw: unknown): WeaponProgress | null {
  if (!isPlainObject(raw)) return null
  const r = raw as Partial<WeaponProgress> & { levels?: Partial<Record<Slot, number>> }
  const levels = defaultProgress().levels
  for (const s of SLOTS) levels[s] = clampLevel(s, Number(r.levels?.[s] ?? LEVEL_MIN))
  return { levels, completed: r.completed === true }
}
