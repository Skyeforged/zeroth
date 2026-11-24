import {
  ENGRAVING_MAIN_PICKS,
  PRIORITY_MULTIPLIER,
  SCORE_GOOD,
  SCORE_PARTIAL,
  SCORE_PERFECT,
} from '@/features/essence/lib/constants'
import { essenceSlots } from '@/features/essence/lib/essence'
import type { EnergyAlluvium, Id, Slot, Weapon } from '@/types/data'

/** Something the user wants to farm an essence for: a weapon's essence or a custom essence. */
export interface Target {
  id: Id
  /** Display name (already resolved by the caller). */
  label: string
  essence: Weapon['essence']
  /** Shield: only the slot-3 stat has to match; slots 1 and 2 are ignored. */
  onlySlot3: boolean
  priority: boolean
  custom: boolean
}

export interface Engraving {
  /** The 3 main stats chosen for slot 1. */
  mainStats: Id[]
  /** Subset of `mainStats` that actually matters for the matches (the rest is "[Any]"). */
  requiredMain: Id[]
  /** The single locked stat, in slot 2 or slot 3. */
  lock: Lock
}

export interface Lock {
  slot: 'slot2' | 'slot3'
  stat: Id
}

export type MatchLevel = 'perfect' | 'good' | 'partial'

export interface TargetMatch {
  target: Target
  level: MatchLevel
  /** Which required slots can drop under the engraving. */
  slots: Record<Slot, boolean>
  /** Slots that count toward this target (all 3, or only slot 3 for shield targets). */
  required: Slot[]
  points: number
}

export interface AlluviumResult {
  alluviumId: Id
  points: number
  perfect: TargetMatch[]
  good: TargetMatch[]
  partial: TargetMatch[]
  /** Best engraving for this alluvium, or null if nothing matches at all. */
  engraving: Engraving | null
  /** Other locks that score the same with the same required main stats. */
  altLocks: Lock[]
}

/** All k-sized combinations of `items`, in stable order. */
export function combinations<T>(items: readonly T[], k: number): T[][] {
  const out: T[][] = []
  const pick = (start: number, acc: T[]) => {
    if (acc.length === k) {
      out.push([...acc])
      return
    }
    for (let i = start; i < items.length; i++) {
      acc.push(items[i]!)
      pick(i + 1, acc)
      acc.pop()
    }
  }
  pick(0, [])
  return out
}

function slotsThatCanDrop(
  target: Target,
  alluvium: EnergyAlluvium,
  mainSubset: readonly Id[],
  lock: Lock,
): Record<Slot, boolean> {
  const { essence } = target
  return {
    slot1: mainSubset.includes(essence.slot1),
    slot2:
      essence.slot2 !== undefined &&
      alluvium.slot2Pool.includes(essence.slot2) &&
      (lock.slot !== 'slot2' || lock.stat === essence.slot2),
    slot3:
      alluvium.slot3Pool.includes(essence.slot3) &&
      (lock.slot !== 'slot3' || lock.stat === essence.slot3),
  }
}

function matchFor(
  target: Target,
  alluvium: EnergyAlluvium,
  mainSubset: readonly Id[],
  lock: Lock,
): TargetMatch | null {
  const slots = slotsThatCanDrop(target, alluvium, mainSubset, lock)
  // Shield targets only need slot 3; 3-star weapons have no slot 2.
  const required: Slot[] = target.onlySlot3 ? ['slot3'] : essenceSlots(target.essence)
  const count = required.filter((s) => slots[s]).length
  if (count === 0) return null

  const level: MatchLevel =
    count === required.length ? 'perfect' : count === required.length - 1 ? 'good' : 'partial'
  const base = level === 'perfect' ? SCORE_PERFECT : level === 'good' ? SCORE_GOOD : SCORE_PARTIAL
  return {
    target,
    level,
    slots,
    required,
    points: base * (target.priority ? PRIORITY_MULTIPLIER : 1),
  }
}

/** Does locking this stat help any target (i.e. does some target actually need it in that slot)? */
function isMeaningfulLock(targets: readonly Target[], lock: Lock): boolean {
  return targets.some((t) =>
    lock.slot === 'slot3'
      ? t.essence.slot3 === lock.stat
      : !t.onlySlot3 && t.essence.slot2 === lock.stat,
  )
}

interface Candidate {
  matches: TargetMatch[]
  points: number
  perfectCount: number
  meaningful: boolean
  mainStats: Id[]
  requiredMain: Id[]
  lock: Lock
}

function isBetter(a: Candidate, b: Candidate | null): boolean {
  if (!b) return a.points > 0
  if (a.points !== b.points) return a.points > b.points
  if (a.perfectCount !== b.perfectCount) return a.perfectCount > b.perfectCount
  if (a.meaningful !== b.meaningful) return a.meaningful
  return a.requiredMain.length < b.requiredMain.length
}

/** Best engraving + matches for one alluvium (brute force over every engraving). */
export function bestForAlluvium(
  targets: readonly Target[],
  alluvium: EnergyAlluvium,
  mainStats: readonly Id[],
): AlluviumResult {
  const subsets = combinations(mainStats, Math.min(ENGRAVING_MAIN_PICKS, mainStats.length))
  const locks: Lock[] = [
    ...alluvium.slot2Pool.map((stat) => ({ slot: 'slot2' as const, stat })),
    ...alluvium.slot3Pool.map((stat) => ({ slot: 'slot3' as const, stat })),
  ]
  const meaningfulByLock = new Map<string, boolean>(
    locks.map((l) => [`${l.slot}:${l.stat}`, isMeaningfulLock(targets, l)]),
  )

  let best: Candidate | null = null
  const all: Candidate[] = []
  for (const subset of subsets) {
    for (const lock of locks) {
      const matches: TargetMatch[] = []
      for (const t of targets) {
        const m = matchFor(t, alluvium, subset, lock)
        if (m) matches.push(m)
      }
      const requiredMain = [
        ...new Set(matches.filter((m) => m.required.includes('slot1') && m.slots.slot1).map((m) => m.target.essence.slot1)),
      ]
      const candidate: Candidate = {
        matches,
        points: matches.reduce((sum, m) => sum + m.points, 0),
        perfectCount: matches.filter((m) => m.level === 'perfect').length,
        meaningful: meaningfulByLock.get(`${lock.slot}:${lock.stat}`) ?? false,
        mainStats: subset,
        requiredMain,
        lock,
      }
      all.push(candidate)
      if (isBetter(candidate, best)) best = candidate
    }
  }

  if (!best) {
    return { alluviumId: alluvium.id, points: 0, perfect: [], good: [], partial: [], engraving: null, altLocks: [] }
  }

  const reqKey = (c: Candidate) => [...c.requiredMain].sort().join(',')
  const altLocks: Lock[] = []
  for (const c of all) {
    if (
      c.points === best.points &&
      c.perfectCount === best.perfectCount &&
      c.meaningful &&
      reqKey(c) === reqKey(best) &&
      !(c.lock.slot === best.lock.slot && c.lock.stat === best.lock.stat) &&
      !altLocks.some((l) => l.slot === c.lock.slot && l.stat === c.lock.stat)
    ) {
      altLocks.push(c.lock)
    }
  }

  const order = (level: MatchLevel) => best!.matches.filter((m) => m.level === level)
  return {
    alluviumId: alluvium.id,
    points: best.points,
    perfect: order('perfect'),
    good: order('good'),
    partial: order('partial'),
    engraving: { mainStats: best.mainStats, requiredMain: best.requiredMain, lock: best.lock },
    altLocks,
  }
}

/** Rank alluviums by points (always assuming the best engraving). */
export function rankAlluviums(
  targets: readonly Target[],
  alluviums: readonly EnergyAlluvium[],
  mainStats: readonly Id[],
): AlluviumResult[] {
  return alluviums
    .map((alluvium) => bestForAlluvium(targets, alluvium, mainStats))
    .sort(
      (a, b) =>
        b.points - a.points ||
        b.perfect.length - a.perfect.length ||
        a.alluviumId.localeCompare(b.alluviumId),
    )
}
