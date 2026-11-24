/**
 * Pure helpers for reading the Endfield Talos Wiki (endfield.wiki.gg) "Energy Alluvium" page.
 * No network, filesystem or Vue code lives here so it can be unit-tested with plain strings.
 *
 * The page has one table per region. Each row is
 *   | [[Location]]
 *   | {{E|Enemy|count}} ...
 *   | {{I|Flawless Essence: Efficacy}} ... {{I|Flawless Essence}}
 * The `Flawless Essence: <Skill>` items are the location's slot-3 stats. The plain `Flawless Essence` item carries
 * no stat and is ignored. The page has no slot-2 information.
 */
import { buildStatLookup, toSnakeId, type Slot, type StatLookup } from './weapon-wikitext'

export { buildStatLookup, toSnakeId }
export type { Slot, StatLookup }

/** Number of slot-3 stats per Energy Alluvium (same as `POOL_SIZE` in src/features/essence/lib/constants.ts). */
export const POOL_SIZE = 8

export interface ParsedAlluvium {
  /** snake_case id derived from the page title. */
  id: string
  /** Wiki page title, used as the display name. */
  title: string
  slot3Pool: string[]
}

export interface AlluviumGap {
  subject: string
  field: string
  problem: string
}

export interface ParsedAlluviumPage {
  alluviums: ParsedAlluvium[]
  gaps: AlluviumGap[]
}

/** `[[Page]]` or `[[Page|Label]]` to the page title (the link target). */
export function linkTarget(cell: string): string | null {
  const match = /\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/.exec(cell)
  return match ? match[1]!.replace(/_/g, ' ').replace(/\s+/g, ' ').trim() : null
}

/** The skill names of every `{{I|Flawless Essence: Skill}}` item in a cell. The plain item has no skill. */
export function flawlessSkills(cell: string): string[] {
  return [...cell.matchAll(/\{\{\s*I\s*\|\s*Flawless Essence\s*:\s*([^|}]+?)\s*(?:\|[^}]*)?\}\}/gi)].map((m) => m[1]!.trim())
}

/**
 * Parses the alluvium tables. A row whose pool is not exactly 8 distinct slot-3 stats (unknown name, wrong slot,
 * wrong count) becomes a gap and is never guessed or partially kept.
 */
export function parseAlluviumPage(wikitext: string, lookup: StatLookup): ParsedAlluviumPage {
  const alluviums: ParsedAlluvium[] = []
  const gaps: AlluviumGap[] = []

  for (const table of wikitext.split(/^\{\|/m).slice(1)) {
    const body = table.slice(0, table.search(/^\|\}/m) === -1 ? undefined : table.search(/^\|\}/m))
    for (const row of body.split(/^\|-/m)) {
      // Cells are lines starting with a single `|` (header cells start with `!`).
      const cells = row
        .split('\n')
        .filter((line) => /^\|(?![|}+-])/.test(line))
        .map((line) => line.slice(1).trim())
      if (cells.length < 3) continue

      const title = linkTarget(cells[0]!)
      if (!title) continue
      const id = toSnakeId(title)
      const subject = `alluvium:${title}`
      if (!id) {
        gaps.push({ subject, field: 'id', problem: 'title produced an empty id' })
        continue
      }

      const problems: string[] = []
      const pool: string[] = []
      for (const raw of flawlessSkills(cells[2]!)) {
        const entry = lookup.get(raw.toLowerCase())
        if (!entry) problems.push(`unknown stat name "${raw}"`)
        else if (entry.slot !== 'slot3') problems.push(`"${raw}" is a ${entry.slot} stat, expected slot3`)
        else if (pool.includes(entry.id)) problems.push(`duplicate slot3 stat "${entry.id}"`)
        else pool.push(entry.id)
      }
      if (problems.length === 0 && pool.length !== POOL_SIZE) {
        problems.push(`slot3 pool has ${pool.length} stats, expected ${POOL_SIZE}`)
      }
      if (problems.length > 0) {
        gaps.push({ subject, field: 'slot3Pool', problem: problems.join('; ') })
        continue
      }
      alluviums.push({ id, title, slot3Pool: pool })
    }
  }

  return { alluviums, gaps }
}
