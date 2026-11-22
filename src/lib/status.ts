import { LEVEL_MAX, LEVEL_MIN } from '@/lib/constants'
import { SLOTS, type Slot } from '@/types/data'

export type WeaponStatus = 'unobtained' | 'obtained' | 'completed'

export interface WeaponProgress {
  obtained: boolean
  levels: Record<Slot, number>
  /** Manually mark as completed even if levels are not maxed. */
  completedOverride: boolean
  /** Optimizer only needs this weapon's slot-3 stat to match. */
  onlySlot3: boolean
}

export function defaultProgress(): WeaponProgress {
  return {
    obtained: false,
    levels: { slot1: LEVEL_MIN, slot2: LEVEL_MIN, slot3: LEVEL_MIN },
    completedOverride: false,
    onlySlot3: false,
  }
}

/**
 * True when every slot the weapon's essence has is at its max level.
 * `slots` defaults to all three; pass `essenceSlots(weapon.essence)` for 3-star weapons (no slot 2).
 */
export function isMaxed(p: WeaponProgress, slots: readonly Slot[] = SLOTS): boolean {
  return slots.every((s) => p.levels[s] >= LEVEL_MAX[s])
}

export function deriveStatus(p: WeaponProgress, slots: readonly Slot[] = SLOTS): WeaponStatus {
  if (!p.obtained) return 'unobtained'
  if (p.completedOverride || isMaxed(p, slots)) return 'completed'
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

/** Repair untrusted progress (e.g. from localStorage or an import) into a valid shape. */
export function sanitizeProgress(raw: unknown): WeaponProgress {
  const base = defaultProgress()
  if (typeof raw !== 'object' || raw === null) return base
  const r = raw as Partial<WeaponProgress> & { levels?: Partial<Record<Slot, number>> }
  const levels = { ...base.levels }
  for (const s of SLOTS) levels[s] = clampLevel(s, Number(r.levels?.[s] ?? LEVEL_MIN))
  return {
    obtained: r.obtained === true,
    levels,
    completedOverride: r.completedOverride === true,
    onlySlot3: r.onlySlot3 === true,
  }
}
