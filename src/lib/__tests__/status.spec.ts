import { describe, expect, it } from 'vitest'
import { defaultProgress, deriveStatus, sanitizeProgress } from '@/lib/status'

describe('deriveStatus', () => {
  it('is unobtained by default', () => {
    expect(deriveStatus(defaultProgress())).toBe('unobtained')
  })

  it('is obtained once the flag is set', () => {
    expect(deriveStatus({ ...defaultProgress(), obtained: true })).toBe('obtained')
  })

  it('auto-completes when all levels are maxed (6, 6, 3)', () => {
    const p = { ...defaultProgress(), obtained: true, levels: { slot1: 6, slot2: 6, slot3: 3 } }
    expect(deriveStatus(p)).toBe('completed')
  })

  it('can be completed manually', () => {
    expect(deriveStatus({ ...defaultProgress(), obtained: true, completedOverride: true })).toBe('completed')
  })

  it('ignores slot 2 for weapons that have none (3-star)', () => {
    const p = { ...defaultProgress(), obtained: true, levels: { slot1: 6, slot2: 1, slot3: 3 } }
    expect(deriveStatus(p)).toBe('obtained')
    expect(deriveStatus(p, ['slot1', 'slot3'])).toBe('completed')
  })

  it('stays unobtained even if maxed levels are stored', () => {
    const p = { ...defaultProgress(), levels: { slot1: 6, slot2: 6, slot3: 3 } }
    expect(deriveStatus(p)).toBe('unobtained')
  })
})

describe('sanitizeProgress', () => {
  it('clamps levels into range and repairs bad input', () => {
    const p = sanitizeProgress({ obtained: true, levels: { slot1: 99, slot2: -4, slot3: 'x' } })
    expect(p.levels).toEqual({ slot1: 6, slot2: 1, slot3: 1 })
    expect(sanitizeProgress(null)).toEqual(defaultProgress())
  })
})
