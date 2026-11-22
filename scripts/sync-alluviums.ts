/**
 * Adds the Energy Alluvium locations from the Endfield Talos Wiki (https://endfield.wiki.gg/wiki/Energy_Alluvium)
 * to src/data/alluviums.json. See docs/data-sync.md.
 *
 * This is an ADD-ONLY sync: alluviums.json is owned by the user (they enter slot2Pool by hand).
 *   - A location that is not in the file yet is appended with `slot3Pool` from the wiki and an EMPTY `slot2Pool`.
 *   - A location that is already in the file is never modified (a differing slot-3 pool is only reported).
 *   - Locale names are only added for new ids; existing names are kept.
 *
 *   npm run sync:alluviums                write the new entries
 *   npm run sync:alluviums -- --dry-run   show what would be added, write nothing
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { buildStatLookup, parseAlluviumPage, toSnakeId, type Slot } from './lib/alluvium-wikitext'

const WIKI_BASE = 'https://endfield.wiki.gg'
const API_URL = `${WIKI_BASE}/api.php`
const PAGE_TITLE = 'Energy Alluvium'
// The wiki blocks browser-like clients but accepts a descriptive one. Keep this honest and generic.
const USER_AGENT =
  process.env.SYNC_USER_AGENT ?? 'zeroth-essence-tools-data-sync/0.1 (personal hobby project; low-volume MediaWiki API reads)'
const RETRY_ATTEMPTS = 3
const RETRY_DELAY_MS = 500

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const ALLUVIUMS_PATH = path.join(REPO_ROOT, 'src', 'data', 'alluviums.json')
const STATS_PATH = path.join(REPO_ROOT, 'src', 'data', 'stats.json')
const LOCALE_PATH = path.join(REPO_ROOT, 'src', 'locales', 'en.json')

interface SourceRef {
  id: string
  label: string
  url: string
  retrievedOn: string
  confidence: 'official' | 'community' | 'guide_site' | 'manual_override'
  revisionId?: number
  notes?: string
}

interface AlluviumRecord {
  id: string
  slot2Pool: string[]
  slot3Pool: string[]
  sourceRefs?: SourceRef[]
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function fetchPage(): Promise<{ revisionId: number; wikitext: string }> {
  const url = `${API_URL}?${new URLSearchParams({
    format: 'json',
    formatversion: '2',
    action: 'query',
    prop: 'revisions',
    rvprop: 'content|ids',
    rvslots: 'main',
    redirects: '1',
    titles: PAGE_TITLE,
  })}`
  let lastError: unknown
  for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
    try {
      const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' } })
      if (response.status === 429 || response.status >= 500) throw new Error(`HTTP ${response.status}`)
      if (!response.ok) throw new Error(`HTTP ${response.status} from ${API_URL}`)
      const json = await response.json()
      if (json.error) throw new Error(`API error: ${json.error.code}: ${json.error.info}`)
      const revision = json.query?.pages?.[0]?.revisions?.[0]
      if (!revision) throw Object.assign(new Error(`page "${PAGE_TITLE}" not found`), { fatal: true })
      return { revisionId: revision.revid, wikitext: revision.slots?.main?.content ?? '' }
    } catch (error) {
      if ((error as { fatal?: boolean }).fatal) throw error
      lastError = error
      if (attempt < RETRY_ATTEMPTS) await sleep(RETRY_DELAY_MS * 2 ** attempt)
    }
  }
  throw new Error(`Request failed after ${RETRY_ATTEMPTS} attempts: ${String(lastError)}`)
}

async function readJson<T>(file: string): Promise<T | undefined> {
  try {
    return JSON.parse(await fs.readFile(file, 'utf8')) as T
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined
    throw error
  }
}

/** Deterministic JSON text: 2-space indent and a trailing newline. */
const toJsonText = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`

async function main() {
  const dryRun = process.argv.slice(2).includes('--dry-run')
  const unknownArgs = process.argv.slice(2).filter((a) => a !== '--dry-run')
  if (unknownArgs.length > 0) throw new Error(`Unknown argument: ${unknownArgs[0]}`)
  const today = new Date().toISOString().slice(0, 10)

  const stats = JSON.parse(await fs.readFile(STATS_PATH, 'utf8')) as Record<Slot, string[]>
  const locale = JSON.parse(await fs.readFile(LOCALE_PATH, 'utf8')) as Record<string, Record<string, string>>
  const lookup = buildStatLookup(stats, locale.stats ?? {})

  console.log(`Fetching ${PAGE_TITLE} from ${WIKI_BASE} ...`)
  const { revisionId, wikitext } = await fetchPage()
  const parsed = parseAlluviumPage(wikitext, lookup)

  console.log(`Parsed ${parsed.alluviums.length} Energy Alluvium(s) (wiki revision ${revisionId}). Gaps: ${parsed.gaps.length || 'none'}`)
  for (const g of parsed.gaps) console.log(`  - ${g.subject}: ${g.field}: ${g.problem}`)
  if (parsed.alluviums.length === 0) {
    throw new Error('No Energy Alluviums were parsed; refusing to write anything.')
  }

  const ids = new Set<string>()
  for (const a of parsed.alluviums) {
    if (ids.has(a.id)) throw new Error(`Two alluviums produce the id "${a.id}" (latest: "${a.title}")`)
    ids.add(a.id)
  }

  const existing = (await readJson<AlluviumRecord[]>(ALLUVIUMS_PATH)) ?? []
  const kept = existing
  const keptIds = new Set(kept.map((a) => a.id))

  const source: SourceRef = {
    id: 'wiki-gg-energy-alluvium',
    label: 'Endfield Talos Wiki Energy Alluvium page',
    url: `${WIKI_BASE}/wiki/${encodeURIComponent(PAGE_TITLE.replace(/ /g, '_'))}`,
    retrievedOn: today,
    confidence: 'community',
    revisionId,
    notes: 'slot3Pool from the Flawless Essence skills listed for the location. The page has no slot-2 data; slot2Pool is entered by hand.',
  }

  const added: AlluviumRecord[] = []
  const names: Record<string, string> = {}
  for (const a of parsed.alluviums) {
    if (keptIds.has(a.id)) {
      const current = kept.find((k) => k.id === a.id)!
      const same = [...current.slot3Pool].sort().join() === [...a.slot3Pool].sort().join()
      if (!same) console.log(`  note: ${a.id} already exists with a different slot3Pool; left untouched.`)
      continue
    }
    added.push({ id: a.id, slot2Pool: [], slot3Pool: a.slot3Pool, sourceRefs: [source] })
    names[a.id] = a.title
  }

  const next = [...kept, ...added].sort((x, y) => x.id.localeCompare(y.id))
  console.log(
    `Existing kept untouched: ${kept.length}. New: ${added.length}${added.length ? ` (${added.map((a) => a.id).join(', ')})` : ''}.`,
  )
  if (added.length === 0) {
    console.log('Nothing to change.')
    return
  }
  if (dryRun) {
    console.log('Dry run: nothing written.')
    return
  }

  // Locale: keep every existing name, add names for the new ids only.
  locale.alluviums = Object.fromEntries(
    Object.entries({ ...names, ...locale.alluviums }).sort(([a], [b]) => a.localeCompare(b)),
  )

  await fs.writeFile(ALLUVIUMS_PATH, toJsonText(next))
  await fs.writeFile(LOCALE_PATH, toJsonText(locale))
  console.log('Wrote src/data/alluviums.json and the alluviums map in src/locales/en.json.')
  if (added.length > 0) console.log('Fill in slot2Pool (8 stats) for the new entries; the app flags empty pools until you do.')
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
