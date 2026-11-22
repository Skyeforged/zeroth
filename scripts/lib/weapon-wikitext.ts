/**
 * Pure helpers for turning Endfield Talos Wiki (endfield.wiki.gg) weapon wikitext into essence data.
 * No network, filesystem or Vue code lives here so it can be unit-tested with plain strings.
 *
 * A weapon page contains two templates we care about:
 *   {{Weapon infobox |name= |rarity=6 |filename=wpn_lance_0012 |type=Polearm ...}}
 *   {{Weapon skill|Polearm|Agility [L]|Physical DMG [L]|Efficacy: Weight of Mountain}}
 * The three skills are the weapon's essence stats (slot 1 main attribute, slot 2 sub stat, slot 3 skill).
 * 3-star weapons only have two skills (no slot 2).
 */

export type Slot = 'slot1' | 'slot2' | 'slot3'
export const SLOT_ORDER: readonly Slot[] = ['slot1', 'slot2', 'slot3']

export interface ParsedEssence {
  slot1: string
  slot2?: string
  slot3: string
}

export interface ParsedWeapon {
  /** snake_case id derived from the page title. */
  id: string
  /** Wiki page title, used as the display name. */
  title: string
  internalName?: string
  /** Wiki file name of the icon image (the infobox image labelled `Icon`), if any. */
  iconFile?: string
  rarity: number
  /** snake_case weapon type id, e.g. `great_sword`. */
  type: string
  essence: ParsedEssence
}

export interface StatLookupEntry {
  slot: Slot
  id: string
}

/** Lower-cased display name to the stat id and the slot it belongs to. */
export type StatLookup = Map<string, StatLookupEntry>

/** Returns the inner text of `{{name ...}}` (without the braces), handling nested templates. */
export function extractTemplate(wikitext: string, name: string): string | null {
  const open = new RegExp(`\\{\\{\\s*${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*(?=[|}\\n])`, 'i')
  const match = open.exec(wikitext)
  if (!match) return null

  let start = match.index + match[0].length
  // Skip the separator after the template name so the body is `Polearm|A|B`, not `|Polearm|A|B`
  // (a leading empty argument would shift every positional argument by one).
  if (wikitext[start] === '|') start++
  let depth = 1
  for (let i = start; i < wikitext.length - 1; i++) {
    const pair = wikitext.slice(i, i + 2)
    if (pair === '{{') {
      depth++
      i++
    } else if (pair === '}}') {
      depth--
      if (depth === 0) return wikitext.slice(start, i)
      i++
    }
  }
  return null
}

/** Splits template arguments on top-level `|` (ignores pipes inside `[[...]]` and nested `{{...}}`). */
export function splitTemplateArgs(inner: string): string[] {
  const args: string[] = []
  let current = ''
  let braces = 0
  let brackets = 0
  for (let i = 0; i < inner.length; i++) {
    const pair = inner.slice(i, i + 2)
    if (pair === '{{') {
      braces++
      current += pair
      i++
    } else if (pair === '}}') {
      braces--
      current += pair
      i++
    } else if (pair === '[[') {
      brackets++
      current += pair
      i++
    } else if (pair === ']]') {
      brackets--
      current += pair
      i++
    } else if (inner[i] === '|' && braces === 0 && brackets === 0) {
      args.push(current)
      current = ''
    } else {
      current += inner[i]
    }
  }
  args.push(current)
  return args
}

/** Parses the named arguments (`key = value`) of the weapon infobox. */
export function parseInfobox(wikitext: string): Record<string, string> | null {
  const inner = extractTemplate(wikitext, 'Weapon infobox')
  if (inner === null) return null
  const fields: Record<string, string> = {}
  for (const arg of splitTemplateArgs(inner)) {
    const eq = arg.indexOf('=')
    if (eq === -1) continue
    fields[arg.slice(0, eq).trim().toLowerCase()] = arg.slice(eq + 1).trim()
  }
  return fields
}

export interface InfoboxImage {
  /** Wiki file name without the `File:` prefix, spaces instead of underscores. */
  file: string
  label: string
}

/**
 * Parses the infobox `images` field: `Mountain_Bearer icon.png:Icon;\nMountain_Bearer.png:Full;...`.
 * Entries are separated by `;`, the label follows the last `:`.
 */
export function parseInfoboxImages(raw: string | undefined): InfoboxImage[] {
  if (!raw) return []
  const images: InfoboxImage[] = []
  for (const entry of raw.split(';')) {
    const text = entry.trim()
    const colon = text.lastIndexOf(':')
    if (colon <= 0) continue
    const file = text
      .slice(0, colon)
      .replace(/^(?:File|Image):/i, '')
      .replace(/_/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    const label = text.slice(colon + 1).trim()
    if (file && label) images.push({ file, label })
  }
  return images
}

/** The raw skill names of `{{Weapon skill|Type|Skill 1|Skill 2|Skill 3}}`, or null if the template is absent. */
export function parseSkills(wikitext: string): { type: string; skills: string[] } | null {
  const inner = extractTemplate(wikitext, 'Weapon skill')
  if (inner === null) return null
  const [type = '', ...skills] = splitTemplateArgs(inner).map((s) => s.trim())
  return { type, skills: skills.filter((s) => s !== '') }
}

/** `Agility [L]` becomes `Agility`; `Efficacy: Weight of Mountain` becomes `Efficacy`. */
export function normalizeSkillName(raw: string): string {
  return raw
    .replace(/\s*\[[LMS]\]\s*$/i, '')
    .split(':')[0]!
    .replace(/\s+/g, ' ')
    .trim()
}

/** snake_case id from a display name. Apostrophes vanish; other punctuation becomes `_`. */
export function toSnakeId(name: string): string {
  return name
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

/** Builds the name lookup from the stat lists and their English display names. */
export function buildStatLookup(
  stats: Record<Slot, string[]>,
  names: Record<string, string>,
): StatLookup {
  const lookup: StatLookup = new Map()
  for (const slot of SLOT_ORDER) {
    for (const id of stats[slot]) {
      const display = names[id]
      if (!display) throw new Error(`No English display name for stat "${id}" in locales/en.json`)
      const key = display.toLowerCase()
      const existing = lookup.get(key)
      if (existing) throw new Error(`Stat name "${display}" is ambiguous (${existing.id} and ${id})`)
      lookup.set(key, { slot, id })
    }
  }
  return lookup
}

export interface EssenceResult {
  essence?: ParsedEssence
  problems: string[]
}

/** Maps the skill names to one stat per slot. Slot 2 may be missing (3-star weapons). */
export function classifySkills(skills: string[], lookup: StatLookup): EssenceResult {
  const problems: string[] = []
  const found: Partial<Record<Slot, string>> = {}

  for (const raw of skills) {
    const name = normalizeSkillName(raw)
    const entry = lookup.get(name.toLowerCase())
    if (!entry) {
      problems.push(`unknown stat name "${name}" (from "${raw}")`)
      continue
    }
    if (found[entry.slot]) {
      problems.push(`two ${entry.slot} stats: "${found[entry.slot]}" and "${entry.id}"`)
      continue
    }
    found[entry.slot] = entry.id
  }

  if (!found.slot1) problems.push('missing slot1 (main attribute) stat')
  if (!found.slot3) problems.push('missing slot3 (skill) stat')
  if (problems.length > 0) return { problems }

  const essence: ParsedEssence = { slot1: found.slot1!, slot3: found.slot3! }
  if (found.slot2) essence.slot2 = found.slot2
  return { essence, problems }
}

export type PageResult =
  | { kind: 'weapon'; weapon: ParsedWeapon }
  | { kind: 'skipped'; reason: string }
  | { kind: 'gap'; title: string; field: string; problem: string }

/** Parses one wiki page. Pages without a weapon infobox (such as the list page) are skipped, not gaps. */
export function parseWeaponPage(title: string, wikitext: string, lookup: StatLookup): PageResult {
  const infobox = parseInfobox(wikitext)
  if (!infobox) return { kind: 'skipped', reason: 'no Weapon infobox' }

  const rarity = Number.parseInt(infobox.rarity ?? '', 10)
  if (!Number.isInteger(rarity) || rarity < 1 || rarity > 6) {
    return { kind: 'gap', title, field: 'rarity', problem: `invalid rarity "${infobox.rarity ?? ''}"` }
  }

  const skillTemplate = parseSkills(wikitext)
  if (!skillTemplate) {
    return { kind: 'gap', title, field: 'essence', problem: 'no Weapon skill template' }
  }

  const typeName = infobox.type || skillTemplate.type
  if (!typeName) return { kind: 'gap', title, field: 'type', problem: 'no weapon type' }

  const result = classifySkills(skillTemplate.skills, lookup)
  if (!result.essence) {
    return { kind: 'gap', title, field: 'essence', problem: result.problems.join('; ') }
  }

  const id = toSnakeId(title)
  if (!id) return { kind: 'gap', title, field: 'id', problem: 'title produced an empty id' }

  return {
    kind: 'weapon',
    weapon: {
      id,
      title,
      internalName: infobox.filename || undefined,
      iconFile: parseInfoboxImages(infobox.images).find((i) => i.label.toLowerCase() === 'icon')?.file,
      rarity,
      type: toSnakeId(typeName),
      essence: result.essence,
    },
  }
}
