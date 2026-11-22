import { describe, expect, it } from 'vitest'
import { rarityColor } from '../rarity'

describe('rarityColor', () => {
  it('has a distinct colour for 3 to 6 stars', () => {
    const colors = [3, 4, 5, 6].map((r) => rarityColor(r))
    expect(colors.every(Boolean)).toBe(true)
    expect(new Set(colors).size).toBe(4)
  })

  it('returns undefined for missing or unknown rarities', () => {
    expect(rarityColor(undefined)).toBeUndefined()
    expect(rarityColor(1)).toBeUndefined()
  })
})
