import { describe, expect, it } from 'vitest'
import { combinations, rankAlluviums, type Target } from '@/features/essence/lib/optimizer'
import type { EnergyAlluvium } from '@/types/data'

const MAIN = ['str', 'int', 'will', 'main_attribute', 'agi']

const pool = (prefix: string, ids: number[]) => ids.map((n) => `${prefix}_${n}`)

const alluviumA: EnergyAlluvium = { id: 'alluvium_a', slot2Pool: pool('sub', [1, 2, 3, 4, 5, 6, 7, 8]), slot3Pool: pool('skill', [1, 2, 3, 4, 5, 6, 7, 8]) }
const alluviumB: EnergyAlluvium = { id: 'alluvium_b', slot2Pool: pool('sub', [3, 4, 5, 6, 7, 8, 9, 10]), slot3Pool: pool('skill', [3, 4, 5, 6, 7, 8, 9, 10]) }

const target = (
  id: string,
  slot1: string,
  sub: number,
  skill: number,
  extra: Partial<Pick<Target, 'onlySlot3' | 'priority'>> = {},
): Target => ({
  id,
  label: id,
  essence: { slot1, slot2: `sub_${sub}`, slot3: `skill_${skill}` },
  onlySlot3: false,
  priority: false,
  custom: false,
  ...extra,
})

describe('combinations', () => {
  it('returns C(5,3) = 10 subsets', () => {
    expect(combinations(MAIN, 3)).toHaveLength(10)
  })
})

describe('rankAlluviums scoring', () => {
  it('scores a perfect match 10 points', () => {
    const [top] = rankAlluviums([target('w1', 'str', 1, 1)], [alluviumA], MAIN)
    expect(top!.perfect).toHaveLength(1)
    expect(top!.points).toBe(10)
  })

  it('needs slot 2 and slot 3 in the alluvium pools to be perfect', () => {
    // sub_1 is only in alluvium A, sub_9 only in alluvium B; skill_3 is in both.
    const results = rankAlluviums([target('w1', 'str', 1, 3), target('w2', 'str', 9, 3)], [alluviumA, alluviumB], MAIN)
    const byId = Object.fromEntries(results.map((r) => [r.alluviumId, r]))
    // Locking skill_3 in slot 3 covers both targets, but only the one with its sub stat in the pool is perfect.
    expect(byId.alluvium_a!.perfect.map((m) => m.target.id)).toEqual(['w1'])
    expect(byId.alluvium_b!.perfect.map((m) => m.target.id)).toEqual(['w2'])
  })

  it('gives a 2/3 (good) match 2 points when one slot cannot drop', () => {
    // sub_9 is not in alluvium A, but slot 1 and slot 3 can.
    const [top] = rankAlluviums([target('w1', 'str', 9, 1)], [alluviumA], MAIN)
    expect(top!.perfect).toHaveLength(0)
    expect(top!.good).toHaveLength(1)
    expect(top!.points).toBe(2)
  })

  it('gives a 1/3 (partial) match 0.5 points', () => {
    // Only skill_1 is in alluvium A's pools (sub_9 is not in the pool).
    const [top] = rankAlluviums([target('w1', 'str', 9, 1)], [alluviumA], ['int', 'will', 'agi', 'main_attribute'])
    expect(top!.partial).toHaveLength(1)
    expect(top!.points).toBe(0.5)
  })

  it('doubles points for Priority targets', () => {
    const [top] = rankAlluviums([target('w1', 'str', 1, 1, { priority: true })], [alluviumA], MAIN)
    expect(top!.points).toBe(20)
  })

  it('covers targets that share one stat by locking that stat', () => {
    // Different slot 2 stats but the same slot 3 skill: locking skill_3 in slot 3 covers both perfectly.
    const [top] = rankAlluviums([target('w1', 'str', 1, 3), target('w2', 'str', 2, 3)], [alluviumA], MAIN)
    expect(top!.perfect).toHaveLength(2)
    expect(top!.engraving?.lock).toEqual({ slot: 'slot3', stat: 'skill_3' })
  })

  it('cannot make targets perfect when they differ in both slot 2 and slot 3', () => {
    const [top] = rankAlluviums([target('w1', 'str', 1, 1), target('w2', 'str', 2, 2)], [alluviumA], MAIN)
    expect(top!.perfect).toHaveLength(1)
  })

  it('limits slot 1 to 3 main stats', () => {
    const same = (id: string, main: string) => target(id, main, 1, 1)
    const [top] = rankAlluviums(
      [same('w1', 'str'), same('w2', 'int'), same('w3', 'will'), same('w4', 'agi')],
      [alluviumA],
      MAIN,
    )
    expect(top!.perfect).toHaveLength(3)
    expect(top!.engraving?.mainStats).toHaveLength(3)
    expect(top!.engraving?.requiredMain).toHaveLength(3)
  })
})

describe('shield (onlySlot3) targets', () => {
  it('is perfect as soon as the slot-3 stat can drop, ignoring slots 1 and 2', () => {
    const [top] = rankAlluviums([target('w1', 'str', 9, 1, { onlySlot3: true })], [alluviumA], MAIN)
    expect(top!.perfect.map((m) => m.target.id)).toEqual(['w1'])
    expect(top!.points).toBe(10)
  })

  it("does not take up a main-stat pick", () => {
    const [top] = rankAlluviums(
      [target('w1', 'str', 1, 1), target('w2', 'int', 1, 1, { onlySlot3: true })],
      [alluviumA],
      MAIN,
    )
    expect(top!.engraving?.requiredMain).toEqual(['str'])
  })
})

describe('3-star weapons (no slot 2)', () => {
  const threeStar: Target = {
    id: 'w3',
    label: 'w3',
    essence: { slot1: 'str', slot3: 'skill_1' },
    onlySlot3: false,
    priority: false,
    custom: false,
  }

  it('is perfect when slot 1 and slot 3 can drop, regardless of slot 2 pools', () => {
    const [top] = rankAlluviums([threeStar], [alluviumA], MAIN)
    expect(top!.perfect.map((m) => m.target.id)).toEqual(['w3'])
    expect(top!.perfect[0]!.required).toEqual(['slot1', 'slot3'])
    expect(top!.points).toBe(10)
  })

  it('is only good when one of its two slots cannot drop', () => {
    const [top] = rankAlluviums([threeStar], [alluviumA], ['int', 'will', 'agi'])
    expect(top!.perfect).toHaveLength(0)
    expect(top!.good.map((m) => m.target.id)).toEqual(['w3'])
  })

  it('does not treat a missing slot 2 as a lockable stat', () => {
    const [top] = rankAlluviums([threeStar], [alluviumA], MAIN)
    expect(top!.engraving?.lock).toEqual({ slot: 'slot3', stat: 'skill_1' })
    expect(top!.altLocks).toEqual([])
  })
})

describe('ranking and engraving output', () => {
  it('ranks by points, then by alluvium id, and drops the engraving when nothing matches', () => {
    // 'str' is left out of the main stats, so nothing in alluvium A can drop (sub_9 / skill_9 are only in B).
    const results = rankAlluviums([target('w1', 'str', 9, 9)], [alluviumA, alluviumB], ['int', 'will', 'agi', 'main_attribute'])
    expect(results.map((r) => r.alluviumId)).toEqual(['alluvium_b', 'alluvium_a'])
    expect(results[1]!.engraving).toBeNull()
  })

  it('lists alternative locks that score the same', () => {
    // A lone target can be pre-engraved on either its sub stat or its skill, with the same score.
    const [top] = rankAlluviums([target('w1', 'str', 1, 1)], [alluviumA], MAIN)
    const locks = [top!.engraving!.lock, ...top!.altLocks].map((l) => `${l.slot}:${l.stat}`).sort()
    expect(locks).toEqual(['slot2:sub_1', 'slot3:skill_1'])
  })
})
