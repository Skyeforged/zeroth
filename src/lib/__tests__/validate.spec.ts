import { describe, expect, it } from 'vitest'
import { locale } from '@/lib/i18n'
import { validateData } from '@/lib/validate'
import { alluviums, stats, weapons } from '@/data'

describe('validateData', () => {
  it('accepts the bundled sample data', () => {
    const result = validateData(stats, weapons, alluviums, locale)
    expect(result.errors).toEqual([])
    expect(result.warnings).toEqual([])
  })

  it('allows a missing slot 2 but not a missing slot 1 or 3', () => {
    const threeStar = { id: 'three_star', essence: { slot1: 'strength', slot3: 'flow' } }
    expect(validateData(stats, [threeStar], alluviums, locale).errors).toEqual([])

    const noSkill = { id: 'no_skill', essence: { slot1: 'strength', slot2: 'atk' } } as unknown as (typeof weapons)[number]
    const { errors } = validateData(stats, [noSkill], alluviums, locale)
    expect(errors.some((e) => e.includes('missing slot3'))).toBe(true)
  })

  it('rejects non-snake_case ids, short pools and unknown stats', () => {
    const badAlluviums = [{ id: 'Bad Id', slot2Pool: ['atk'], slot3Pool: ['nope'] }]
    const { errors } = validateData(stats, weapons, badAlluviums, locale)
    expect(errors.some((e) => e.includes('snake_case'))).toBe(true)
    expect(errors.some((e) => e.includes('expected 8'))).toBe(true)
    expect(errors.some((e) => e.includes('unknown slot3 stat "nope"'))).toBe(true)
  })
})
