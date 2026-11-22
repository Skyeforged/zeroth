import { describe, expect, it } from 'vitest'
import { weaponTypeOptions } from '../weaponTypes'

describe('weaponTypeOptions', () => {
  it('returns distinct types in the preferred order', () => {
    const weapons = [{ type: 'polearm' }, { type: 'sword' }, { type: 'polearm' }, { type: 'arts_unit' }, {}]
    expect(weaponTypeOptions(weapons)).toEqual(['sword', 'polearm', 'arts_unit'])
  })

  it('appends unknown types alphabetically', () => {
    expect(weaponTypeOptions([{ type: 'zither' }, { type: 'sword' }, { type: 'bow' }])).toEqual(['sword', 'bow', 'zither'])
  })
})
