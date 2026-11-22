import { describe, expect, it } from 'vitest'
import {
  buildStatLookup,
  classifySkills,
  extractTemplate,
  normalizeSkillName,
  parseInfobox,
  parseInfoboxImages,
  parseSkills,
  parseWeaponPage,
  splitTemplateArgs,
  toSnakeId,
} from '../lib/weapon-wikitext'

const stats = {
  slot1: ['agility', 'main_attribute'],
  slot2: ['physical_dmg', 'atk'],
  slot3: ['efficacy', 'assault'],
}
const names = {
  agility: 'Agility',
  main_attribute: 'Main Attribute',
  physical_dmg: 'Physical DMG',
  atk: 'ATK',
  efficacy: 'Efficacy',
  assault: 'Assault',
}
const lookup = buildStatLookup(stats, names)

const sixStar = `{{Weapon infobox
|icon = Polearm
|name = Mountain Bearer
|rarity = 6
|images =
Mountain_Bearer icon.png:Icon;
Mountain_Bearer.png:Full
|filename = wpn_lance_0012
|type = Polearm
|source = Acquisition Center: Arsenal Exchange}}
'''Mountain Bearer''' is a 6★ [[Polearm]].

==Skills==
{{Weapon skill|Polearm|Agility [L]|Physical DMG [L]|Efficacy: Weight of Mountain}}
[[Category:Weapons]]`

const threeStar = `{{Weapon infobox
|name = Darhoff 7
|rarity = 3
|filename = wpn_claym_0010
|type = Great Sword}}
{{Weapon skill|Great Sword|Main Attribute [S]|Assault: Armament Prep}}`

describe('template parsing', () => {
  it('splits on top-level pipes only', () => {
    expect(splitTemplateArgs('a|b [[x|y]]|{{t|1|2}}|c')).toEqual(['a', 'b [[x|y]]', '{{t|1|2}}', 'c'])
  })

  it('returns the template body without the leading separator', () => {
    expect(extractTemplate('x {{Weapon skill|Polearm|A|B}} y', 'Weapon skill')).toBe('Polearm|A|B')
    expect(extractTemplate('{{Weapon infobox\n|icon = Polearm\n|rarity = 6}}', 'Weapon infobox')).toBe(
      'icon = Polearm\n|rarity = 6',
    )
    expect(extractTemplate('{{Weapon skill}}', 'Weapon skill')).toBe('')
  })

  it('reads infobox fields and skill arguments', () => {
    expect(parseInfobox(sixStar)).toMatchObject({ rarity: '6', filename: 'wpn_lance_0012', type: 'Polearm' })
    expect(parseSkills(sixStar)).toEqual({
      type: 'Polearm',
      skills: ['Agility [L]', 'Physical DMG [L]', 'Efficacy: Weight of Mountain'],
    })
  })

  it('parses the infobox images field', () => {
    expect(parseInfoboxImages(parseInfobox(sixStar)!.images)).toEqual([
      { file: 'Mountain Bearer icon.png', label: 'Icon' },
      { file: 'Mountain Bearer.png', label: 'Full' },
    ])
    expect(parseInfoboxImages('File:A_b.png:Icon; ;broken;')).toEqual([{ file: 'A b.png', label: 'Icon' }])
    expect(parseInfoboxImages('')).toEqual([])
    expect(parseInfoboxImages(undefined)).toEqual([])
  })

  it('picks the Icon image for a weapon and tolerates a missing one', () => {
    const six = parseWeaponPage('Mountain Bearer', sixStar, lookup)
    expect(six.kind === 'weapon' && six.weapon.iconFile).toBe('Mountain Bearer icon.png')
    const three = parseWeaponPage('Darhoff 7', threeStar, lookup)
    expect(three.kind === 'weapon' && three.weapon.iconFile).toBeUndefined()
  })

  it('returns null when a template is missing', () => {
    expect(parseInfobox('just some text')).toBeNull()
    expect(parseSkills('just some text')).toBeNull()
  })
})

describe('names and ids', () => {
  it('strips magnitude tags and skill descriptions', () => {
    expect(normalizeSkillName('Agility [L]')).toBe('Agility')
    expect(normalizeSkillName('Arts DMG [S]')).toBe('Arts DMG')
    expect(normalizeSkillName('Efficacy: Weight of Mountain')).toBe('Efficacy')
  })

  it('makes snake_case ids from titles', () => {
    expect(toSnakeId('Mountain Bearer')).toBe('mountain_bearer')
    expect(toSnakeId("Pathfinder's Beacon")).toBe('pathfinders_beacon')
    expect(toSnakeId('Opus: The Living')).toBe('opus_the_living')
    expect(toSnakeId('Finchaser 3.0')).toBe('finchaser_3_0')
    expect(toSnakeId('Type 42: Solemn Phalanx')).toBe('type_42_solemn_phalanx')
  })
})

describe('classifySkills', () => {
  it('maps three skills to one stat per slot', () => {
    const result = classifySkills(['Agility [L]', 'Physical DMG [L]', 'Efficacy: Weight of Mountain'], lookup)
    expect(result.essence).toEqual({ slot1: 'agility', slot2: 'physical_dmg', slot3: 'efficacy' })
  })

  it('allows a missing slot 2 (3-star weapons)', () => {
    const result = classifySkills(['Main Attribute [S]', 'Assault: Armament Prep'], lookup)
    expect(result.essence).toEqual({ slot1: 'main_attribute', slot3: 'assault' })
  })

  it('reports unknown stat names instead of guessing', () => {
    const result = classifySkills(['Agility [L]', 'Mystery DMG [L]', 'Efficacy: X'], lookup)
    expect(result.essence).toBeUndefined()
    expect(result.problems.join(' ')).toContain('Mystery DMG')
  })

  it('requires slot 1 and slot 3', () => {
    expect(classifySkills(['Physical DMG [L]'], lookup).problems.join(' ')).toContain('slot1')
  })
})

describe('parseWeaponPage', () => {
  it('parses a 6-star weapon', () => {
    const result = parseWeaponPage('Mountain Bearer', sixStar, lookup)
    expect(result).toMatchObject({
      kind: 'weapon',
      weapon: {
        id: 'mountain_bearer',
        title: 'Mountain Bearer',
        internalName: 'wpn_lance_0012',
        rarity: 6,
        type: 'polearm',
        essence: { slot1: 'agility', slot2: 'physical_dmg', slot3: 'efficacy' },
      },
    })
  })

  it('parses a 3-star weapon without slot 2 and a two-word type', () => {
    const result = parseWeaponPage('Darhoff 7', threeStar, lookup)
    expect(result.kind).toBe('weapon')
    if (result.kind === 'weapon') {
      expect(result.weapon.type).toBe('great_sword')
      expect(result.weapon.essence).toEqual({ slot1: 'main_attribute', slot3: 'assault' })
    }
  })

  it('skips pages that are not weapons and records a gap for broken weapons', () => {
    expect(parseWeaponPage('Weapon', 'Overview prose only', lookup).kind).toBe('skipped')

    const broken = sixStar.replace('Physical DMG [L]', 'Mystery DMG [L]')
    const result = parseWeaponPage('Mountain Bearer', broken, lookup)
    expect(result).toMatchObject({ kind: 'gap', field: 'essence' })
  })
})
