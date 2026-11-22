import { describe, expect, it } from 'vitest'
import { iconIdSet, weaponIconUrl } from '../weaponIcon'

describe('weaponIconUrl', () => {
  it('prefixes the base path', () => {
    expect(weaponIconUrl('mountain_bearer', '/zeroth/')).toBe('/zeroth/weapons/mountain_bearer.png')
    expect(weaponIconUrl('mountain_bearer', '/')).toBe('/weapons/mountain_bearer.png')
  })

  it('adds a missing trailing slash', () => {
    expect(weaponIconUrl('jet', '/zeroth')).toBe('/zeroth/weapons/jet.png')
  })
})

describe('iconIdSet', () => {
  it('only contains weapons that have an icon', () => {
    const set = iconIdSet([{ id: 'a', icon: { file: 'a.png', sha1: 'x' } }, { id: 'b' }])
    expect(set.has('a')).toBe(true)
    expect(set.has('b')).toBe(false)
  })
})
