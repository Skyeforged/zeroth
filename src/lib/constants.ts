import type { Slot } from '@/types/data'

/** Level scale per slot. Minimum is 1 for every slot. */
export const LEVEL_MIN = 1
export const LEVEL_MAX: Record<Slot, number> = { slot1: 6, slot2: 6, slot3: 3 }

/** Each alluvium has this many possible stats in slot 2 and in slot 3. */
export const POOL_SIZE = 8

/** Optimizer scoring: points per target at a alluvium, by match level. */
export const SCORE_PERFECT = 10 // 3/3 required stats can drop
export const SCORE_GOOD = 2 // 2/3
export const SCORE_PARTIAL = 0.5 // 1/3
export const PRIORITY_MULTIPLIER = 2

/** Engraving rules: choose 3 main stats, plus exactly one locked stat in slot 2 OR slot 3. */
export const ENGRAVING_MAIN_PICKS = 3
export const ENGRAVING_LOCKABLE_SLOTS = ['slot2', 'slot3'] as const
