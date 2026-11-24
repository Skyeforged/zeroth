import { describe, expect, it } from 'vitest'
import { defaultProgress, deriveStatus, sanitizeProgress } from '@/features/essence/lib/tracker'

describe('deriveStatus', () => {
  it('is unobtained when there is no record', () => {
    expect(deriveStatus(undefined)).toBe('unobtained')
  })

  it('is obtained when a record exists', () => {
    expect(deriveStatus(defaultProgress())).toBe('obtained')
  })

  it('does not complete automatically when all levels are maxed (6, 6, 3)', () => {
    const p = { ...defaultProgress(), levels: { slot1: 6, slot2: 6, slot3: 3 } }
    expect(deriveStatus(p)).toBe('obtained')
  })

  it('is completed only when marked completed', () => {
    expect(deriveStatus({ ...defaultProgress(), completed: true })).toBe('completed')
  })
})

describe('sanitizeProgress', () => {
  it('clamps levels into range and repairs bad input', () => {
    const p = sanitizeProgress({ levels: { slot1: 99, slot2: -4, slot3: 'x' } })
    expect(p?.levels).toEqual({ slot1: 6, slot2: 1, slot3: 1 })
  })

  it('returns null for invalid input', () => {
    expect(sanitizeProgress(null)).toBeNull()
    expect(sanitizeProgress('x')).toBeNull()
  })
})
