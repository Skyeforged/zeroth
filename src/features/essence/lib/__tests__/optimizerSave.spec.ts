import { describe, expect, it } from 'vitest'
import { defaultOptimizerState, OPTIMIZER_SAVE_VERSION, parseOptimizerSave } from '@/features/essence/lib/optimizerSave'

const essence = { slot1: 'strength', slot2: 'atk', slot3: 'assault' }

describe('parseOptimizerSave', () => {
  it('reads a current-version save and sanitizes it', () => {
    const parsed = parseOptimizerSave({
      version: OPTIMIZER_SAVE_VERSION,
      data: {
        selectedIds: ['w1', 3],
        shieldIds: ['c1'],
        customEssences: [{ id: 'c1', name: '  A  ', essence }, { id: 'bad' }],
        hideCompleted: true,
      },
    })
    expect(parsed).toEqual({
      state: {
        ...defaultOptimizerState(),
        selectedIds: ['w1'],
        shieldIds: ['c1'],
        customEssences: [{ id: 'c1', name: 'A', essence }],
        hideCompleted: true,
      },
      future: false,
    })
  })

  it('fills defaults for missing fields', () => {
    expect(parseOptimizerSave({ version: OPTIMIZER_SAVE_VERSION, data: {} })?.state).toEqual(defaultOptimizerState())
  })

  it('returns null for a payload without a save envelope', () => {
    expect(parseOptimizerSave({ selectedIds: ['w1'] })).toBeNull()
    expect(parseOptimizerSave(null)).toBeNull()
  })

  it('flags saves from a newer version', () => {
    expect(parseOptimizerSave({ version: OPTIMIZER_SAVE_VERSION + 1, data: {} })?.future).toBe(true)
  })
})
