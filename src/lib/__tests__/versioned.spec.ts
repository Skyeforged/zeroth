import { describe, expect, it } from 'vitest'
import { migrate, wrap, type Migrations } from '@/lib/versioned'

// Each step appends its from-version so the chain order is visible.
const steps: Migrations = {
  1: (d) => [...(d as number[]), 1],
  2: (d) => [...(d as number[]), 2],
}

describe('migrate', () => {
  it('runs every step in order from the saved version', () => {
    expect(migrate(wrap(1, []), 3, steps)).toEqual({ data: [1, 2], future: false })
    expect(migrate(wrap(2, []), 3, steps)).toEqual({ data: [2], future: false })
  })

  it('runs no step for the current version', () => {
    expect(migrate(wrap(3, ['x']), 3, steps)).toEqual({ data: ['x'], future: false })
  })

  it('returns a newer-version save unchanged with future = true', () => {
    expect(migrate(wrap(9, ['x']), 3, steps)).toEqual({ data: ['x'], future: true })
  })

  it('throws when a step is missing', () => {
    expect(() => migrate(wrap(1, []), 4, steps)).toThrow(/version 3/)
  })

  it('returns null for anything that is not a save envelope', () => {
    expect(migrate({ a: 1 }, 1, {})).toBeNull()
    expect(migrate({ version: 1 }, 1, {})).toBeNull()
    expect(migrate({ version: 0, data: {} }, 1, {})).toBeNull()
    expect(migrate({ version: '1', data: {} }, 1, {})).toBeNull()
    expect(migrate([], 1, {})).toBeNull()
    expect(migrate(null, 1, {})).toBeNull()
  })
})
