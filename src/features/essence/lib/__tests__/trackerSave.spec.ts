import { describe, expect, it } from 'vitest'
import { parseTrackerSave, TRACKER_SAVE_VERSION } from '@/features/essence/lib/trackerSave'

describe('parseTrackerSave', () => {
  it('passes a current-version save through and drops invalid entries', () => {
    const parsed = parseTrackerSave({
      version: TRACKER_SAVE_VERSION,
      data: { a: { levels: { slot1: 2, slot2: 1, slot3: 1 }, completed: false }, bad: 'x' },
    })
    expect(parsed).toEqual({
      progress: { a: { levels: { slot1: 2, slot2: 1, slot3: 1 }, completed: false } },
      future: false,
    })
  })

  it('returns null for a payload without a save envelope', () => {
    expect(parseTrackerSave({ a: { levels: { slot1: 1, slot2: 1, slot3: 1 }, completed: false } })).toBeNull()
    expect(parseTrackerSave(null)).toBeNull()
  })

  it('flags saves from a newer version', () => {
    expect(parseTrackerSave({ version: TRACKER_SAVE_VERSION + 1, data: {} })?.future).toBe(true)
  })
})
