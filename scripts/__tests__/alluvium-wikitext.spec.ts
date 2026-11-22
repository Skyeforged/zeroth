import { describe, expect, it } from 'vitest'
import { buildStatLookup, flawlessSkills, linkTarget, parseAlluviumPage } from '../lib/alluvium-wikitext'

const skillIds = ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8']
const stats = { slot1: ['agility'], slot2: ['atk'], slot3: skillIds }
const names: Record<string, string> = { agility: 'Agility', atk: 'ATK' }
skillIds.forEach((id, i) => (names[id] = `Skill ${i + 1}`))
const lookup = buildStatLookup(stats, names)

const items = (skills: string[]) => [...skills.map((s) => `{{I|Flawless Essence: ${s}}}`), '{{I|Flawless Essence}}'].join(' ')
const row = (name: string, skills: string[]) => `|-\n| ${name}\n| {{E|Some Enemy|1|g=1}}\n| ${items(skills)}\n`
const page = (rows: string) =>
  `==Valley IV==\n{| class="wikitable"\n|-\n! Location\n! Enemies\n! Essences\n${rows}|}\n\n==Navigation==\n{{Features nav}}`
const all8 = skillIds.map((_, i) => `Skill ${i + 1}`)

describe('linkTarget', () => {
  it('returns the link target, not the label', () => {
    expect(linkTarget(' [[The Hub]]')).toBe('The Hub')
    expect(linkTarget('[[North Wuling Exclusion Zone|North Wuling EZ]]')).toBe('North Wuling Exclusion Zone')
    expect(linkTarget('plain')).toBeNull()
  })
})

describe('flawlessSkills', () => {
  it('lists skills and ignores the plain Flawless Essence', () => {
    expect(flawlessSkills(items(['Efficacy', 'Flow']))).toEqual(['Efficacy', 'Flow'])
    expect(flawlessSkills('{{I|Flawless Essence}}')).toEqual([])
  })
})

describe('parseAlluviumPage', () => {
  it('reads a location with 8 slot-3 stats', () => {
    const result = parseAlluviumPage(page(row('[[The Hub]]', all8)), lookup)
    expect(result.gaps).toEqual([])
    expect(result.alluviums).toEqual([{ id: 'the_hub', title: 'The Hub', slot3Pool: skillIds }])
  })

  it('makes ids from apostrophe titles and uses the link target', () => {
    const result = parseAlluviumPage(page(row("[[Si's Painting]]", all8)), lookup)
    expect(result.alluviums[0]!.id).toBe('sis_painting')
  })

  it('reports a gap for an unknown stat, a wrong-slot stat, or a pool that is not 8', () => {
    const unknown = parseAlluviumPage(page(row('[[A]]', [...all8.slice(0, 7), 'Bogus'])), lookup)
    expect(unknown.alluviums).toEqual([])
    expect(unknown.gaps[0]!.problem).toContain('unknown stat name "Bogus"')

    const wrongSlot = parseAlluviumPage(page(row('[[B]]', [...all8.slice(0, 7), 'ATK'])), lookup)
    expect(wrongSlot.gaps[0]!.problem).toContain('expected slot3')

    const short = parseAlluviumPage(page(row('[[C]]', all8.slice(0, 5))), lookup)
    expect(short.gaps[0]!.problem).toContain('expected 8')
  })

  it('skips the header row and non-location text', () => {
    expect(parseAlluviumPage(page(''), lookup)).toEqual({ alluviums: [], gaps: [] })
  })
})
