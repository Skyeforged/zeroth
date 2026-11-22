/**
 * Pulls every weapon from the Endfield Talos Wiki (https://endfield.wiki.gg) through the MediaWiki API and
 * writes the weapon data plus its source trail into src/data/. See docs/data-sync.md.
 *
 *   npm run sync:weapons                      write the files
 *   npm run sync:weapons -- --dry-run         show what would change, write nothing
 *   npm run sync:weapons -- --force           replace even if previously known weapons would be lost
 *   npm run sync:weapons -- --no-images       do not fetch weapon icons (keeps the recorded ones)
 *   npm run sync:weapons -- --game-version 1.6   record the game version in the manifest
 *
 * Outputs (all generated, do not edit by hand):
 *   src/data/weapons.json   weapons with essence stats, icon info and per-record sourceRefs
 *   public/weapons/<id>.png weapon icons (Icon image of the wiki infobox)
 *   src/data/sources.json   index of every source used
 *   src/data/gaps.json      weapons that could not be parsed (excluded from weapons.json)
 *   src/data/manifest.json  snapshot date, counts and a content hash
 *   src/locales/en.json     only the `weapons` map (id to wiki page title) is replaced
 */
import { createHash } from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  buildStatLookup,
  parseWeaponPage,
  toSnakeId,
  type ParsedEssence,
  type ParsedWeapon,
  type Slot,
} from './lib/weapon-wikitext'

const WIKI_BASE = 'https://endfield.wiki.gg'
const API_URL = `${WIKI_BASE}/api.php`
const CATEGORY = 'Category:Weapons'
// The wiki blocks browser-like clients but accepts a descriptive one. Keep this honest and generic.
const USER_AGENT =
  process.env.SYNC_USER_AGENT ?? 'zeroth-essence-tools-data-sync/0.1 (personal hobby project; low-volume MediaWiki API reads)'
const BATCH_SIZE = 20
const DELAY_MS = 500
const RETRY_ATTEMPTS = 3

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DATA_DIR = path.join(REPO_ROOT, 'src', 'data')
/** Weapon icons are served as static files: `<base>/weapons/<id>.png`. */
const ICON_DIR = path.join(REPO_ROOT, 'public', 'weapons')
const LOCALE_PATH =path.join(REPO_ROOT, 'src', 'locales', 'en.json')
const FILES = {
  weapons: path.join(DATA_DIR, 'weapons.json'),
  sources: path.join(DATA_DIR, 'sources.json'),
  gaps: path.join(DATA_DIR, 'gaps.json'),
  manifest: path.join(DATA_DIR, 'manifest.json'),
  stats: path.join(DATA_DIR, 'stats.json'),
}

type Confidence = 'official' | 'community' | 'guide_site' | 'manual_override'

interface SourceRef {
  id: string
  label: string
  url: string
  retrievedOn: string
  confidence: Confidence
  revisionId?: number
  notes?: string
}

interface WeaponRecord {
  id: string
  internalName?: string
  rarity: number
  type: string
  essence: ParsedEssence
  icon?: { file: string; sha1: string }
  sourceRefs: SourceRef[]
}

interface Gap {
  subject: string
  field: string
  problem: string
  sourceId: string
}

interface Options {
  dryRun: boolean
  force: boolean
  noImages: boolean
  gameVersion?: string
}

function parseArgs(argv: string[]): Options {
  const options: Options = { dryRun: false, force: false, noImages: false }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!
    if (arg === '--dry-run') options.dryRun = true
    else if (arg === '--no-images') options.noImages = true
    else if (arg === '--force') options.force = true
    else if (arg === '--game-version') options.gameVersion = argv[++i]
    else if (arg.startsWith('--game-version=')) options.gameVersion = arg.slice('--game-version='.length)
    else throw new Error(`Unknown argument: ${arg}`)
  }
  if (options.gameVersion !== undefined && !/^[\w.-]+$/.test(options.gameVersion)) {
    throw new Error('--game-version may only contain letters, digits, ".", "_" and "-"')
  }
  return options
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function apiGet(params: Record<string, string>): Promise<any> {
  const url = `${API_URL}?${new URLSearchParams({ format: 'json', formatversion: '2', ...params })}`
  let lastError: unknown
  for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
    try {
      const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' } })
      if (response.status === 429 || response.status >= 500) throw new Error(`HTTP ${response.status}`)
      if (!response.ok) throw new Error(`HTTP ${response.status} from ${API_URL}`)
      const json = await response.json()
      if (json.error) throw new Error(`API error: ${json.error.code}: ${json.error.info}`)
      return json
    } catch (error) {
      lastError = error
      if (attempt < RETRY_ATTEMPTS) await sleep(DELAY_MS * 2 ** attempt)
    }
  }
  throw new Error(`Request failed after ${RETRY_ATTEMPTS} attempts: ${String(lastError)}`)
}

async function listWeaponTitles(): Promise<string[]> {
  const titles: string[] = []
  let cmcontinue: string | undefined
  do {
    const json = await apiGet({
      action: 'query',
      list: 'categorymembers',
      cmtitle: CATEGORY,
      cmnamespace: '0',
      cmlimit: '500',
      ...(cmcontinue ? { cmcontinue } : {}),
    })
    titles.push(...json.query.categorymembers.map((m: { title: string }) => m.title))
    cmcontinue = json.continue?.cmcontinue
    await sleep(DELAY_MS)
  } while (cmcontinue)
  return titles.sort((a, b) => a.localeCompare(b))
}

interface WikiPage {
  title: string
  revisionId: number
  wikitext: string
}

async function fetchPages(titles: string[]): Promise<WikiPage[]> {
  const pages: WikiPage[] = []
  for (let i = 0; i < titles.length; i += BATCH_SIZE) {
    const json = await apiGet({
      action: 'query',
      prop: 'revisions',
      rvprop: 'content|ids',
      rvslots: 'main',
      redirects: '1',
      titles: titles.slice(i, i + BATCH_SIZE).join('|'),
    })
    for (const page of json.query.pages) {
      const revision = page.revisions?.[0]
      if (page.missing || !revision) continue
      pages.push({ title: page.title, revisionId: revision.revid, wikitext: revision.slots?.main?.content ?? '' })
    }
    await sleep(DELAY_MS)
  }
  return pages
}

interface ImageInfo {
  url: string
  /** sha1 of the file as stored by the wiki; used to detect changes, not to verify downloads. */
  sha1: string
  mime: string
}

/** Resolves wiki file names (without `File:`) to their direct URL and sha1 through `prop=imageinfo`. */
async function resolveImages(files: string[]): Promise<Map<string, ImageInfo>> {
  const result = new Map<string, ImageInfo>()
  const IMAGE_BATCH = 50
  for (let i = 0; i < files.length; i += IMAGE_BATCH) {
    const json = await apiGet({
      action: 'query',
      prop: 'imageinfo',
      iiprop: 'url|sha1|mime',
      titles: files
        .slice(i, i + IMAGE_BATCH)
        .map((f) => `File:${f}`)
        .join('|'),
    })
    for (const page of json.query.pages) {
      const info = page.imageinfo?.[0]
      if (page.missing || !info?.url || !info.sha1) continue
      result.set(String(page.title).replace(/^File:/, ''), { url: info.url, sha1: info.sha1, mime: info.mime ?? '' })
    }
    await sleep(DELAY_MS)
  }
  return result
}

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

/**
 * Downloads one image with the same polite headers and retries as the API calls. The response must be a PNG.
 * The wiki's sha1 is deliberately not compared with the downloaded bytes: the CDN can re-encode images, so the
 * bytes differ from the stored file (the sha1 is only used to detect that the wiki file changed).
 */
async function downloadImage(info: ImageInfo): Promise<Buffer> {
  let lastError: unknown
  for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
    try {
      const response = await fetch(info.url, { headers: { 'User-Agent': USER_AGENT } })
      if (response.status === 429 || response.status >= 500) throw new Error(`HTTP ${response.status}`)
      if (!response.ok) throw new Error(`HTTP ${response.status} from ${info.url}`)
      const bytes = Buffer.from(await response.arrayBuffer())
      // Not retried: a wrong body (for example an HTML error page) will not fix itself.
      if (bytes.length <= PNG_SIGNATURE.length || !bytes.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)) {
        throw Object.assign(new Error(`response from ${info.url} is not a PNG (${bytes.length} bytes)`), { fatal: true })
      }
      return bytes
    } catch (error) {
      if ((error as { fatal?: boolean }).fatal) throw error
      lastError = error
      if (attempt < RETRY_ATTEMPTS) await sleep(DELAY_MS * 2 ** attempt)
    }
  }
  throw new Error(`Download failed after ${RETRY_ATTEMPTS} attempts: ${String(lastError)}`)
}

const fileExists = (file: string) =>
  fs.access(file).then(
    () => true,
    () => false,
  )

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

/** Hash of the content only: `retrievedOn` is ignored so a re-run on a later day does not look like a change. */
function contentHash(content: unknown): string {
  const text = JSON.stringify(content, (key, value) => (key === 'retrievedOn' ? undefined : value))
  return createHash('sha256').update(text).digest('hex')
}

const wikiUrl = (title: string) => `${WIKI_BASE}/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`
const pageSourceId = (title: string) => `wiki-gg-${toSnakeId(title)}`
const iconSourceId = (weaponId: string) => `wiki-gg-icon-${weaponId}`
const iconPath = (weaponId: string) => path.join(ICON_DIR, `${weaponId}.png`)

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const today = new Date().toISOString().slice(0, 10)

  const stats = JSON.parse(await fs.readFile(FILES.stats, 'utf8')) as Record<Slot, string[]>
  const locale = JSON.parse(await fs.readFile(LOCALE_PATH, 'utf8')) as Record<string, Record<string, string>>
  const lookup = buildStatLookup(stats, locale.stats ?? {})

  console.log(`Listing ${CATEGORY} ...`)
  const titles = await listWeaponTitles()
  console.log(`Found ${titles.length} pages. Fetching wikitext in batches of ${BATCH_SIZE} ...`)
  const pages = await fetchPages(titles)

  // Keep the earlier retrievedOn for pages whose wiki revision has not changed.
  const previousWeapons = (await readJson<WeaponRecord[]>(FILES.weapons)) ?? []
  const previousRetrieved = new Map<string, string>()
  for (const w of previousWeapons) {
    for (const ref of w.sourceRefs ?? []) {
      if (ref.revisionId !== undefined) previousRetrieved.set(`${ref.id}@${ref.revisionId}`, ref.retrievedOn)
    }
  }

  const weapons: WeaponRecord[] = []
  const gaps: Gap[] = []
  const pageSources: SourceRef[] = []
  const skipped: string[] = []
  /** Weapon id to wiki page title (the display name). */
  const titleById = new Map<string, string>()
  /** Weapon id to the wiki file name of its icon. */
  const iconFileById = new Map<string, string>()

  for (const page of pages) {
    const result = parseWeaponPage(page.title, page.wikitext, lookup)
    if (result.kind === 'skipped') {
      skipped.push(`${page.title} (${result.reason})`)
      continue
    }

    const sourceId = pageSourceId(page.title)
    const source: SourceRef = {
      id: sourceId,
      label: `Endfield Talos Wiki ${page.title} page`,
      url: wikiUrl(page.title),
      retrievedOn: previousRetrieved.get(`${sourceId}@${page.revisionId}`) ?? today,
      confidence: 'community',
      revisionId: page.revisionId,
    }
    pageSources.push(source)

    if (result.kind === 'gap') {
      gaps.push({ subject: `weapon:${page.title}`, field: result.field, problem: result.problem, sourceId })
      continue
    }

    const w: ParsedWeapon = result.weapon
    titleById.set(w.id, w.title)
    if (w.iconFile) iconFileById.set(w.id, w.iconFile)
    weapons.push({
      id: w.id,
      ...(w.internalName ? { internalName: w.internalName } : {}),
      rarity: w.rarity,
      type: w.type,
      essence: w.essence,
      sourceRefs: [source],
    })
  }

  const seen = new Set<string>()
  for (const w of weapons) {
    if (seen.has(w.id)) throw new Error(`Two weapons produce the id "${w.id}" (latest: "${titleById.get(w.id)}")`)
    seen.add(w.id)
  }
  weapons.sort((a, b) => a.id.localeCompare(b.id))
  gaps.sort((a, b) => a.subject.localeCompare(b.subject))

  if (weapons.length === 0) {
    // A systematic failure (for example a parser or wiki format change): show why before aborting.
    const sample = gaps.slice(0, 5).map((g) => `  - ${g.subject}: ${g.field}: ${g.problem}`)
    const skippedNote = skipped.length ? `\nSkipped pages: ${skipped.slice(0, 5).join(', ')}` : ''
    throw new Error(
      `No weapons were parsed from ${pages.length} pages (${gaps.length} gaps, ${skipped.length} skipped); ` +
        `refusing to write anything.${gaps.length ? `\nFirst gaps:\n${sample.join('\n')}` : ''}${skippedNote}`,
    )
  }

  // Never replace data with worse data: a known weapon must not disappear (placeholders are ignored).
  const lost = previousWeapons
    .map((w) => w.id)
    .filter((id) => !id.startsWith('sample_') && !weapons.some((w) => w.id === id))
  if (lost.length > 0 && !options.force) {
    throw new Error(
      `Refusing to replace weapons.json: ${lost.length} previously known weapon(s) are missing or became gaps: ` +
        `${lost.join(', ')}. Re-run with --force if this is intended.`,
    )
  }

  // Icons: resolve the wiki file info, download what is new or changed, and record icon + source on the weapon.
  const iconSources: SourceRef[] = []
  const previousById = new Map(previousWeapons.map((w) => [w.id, w]))
  if (options.noImages) {
    // Keep whatever icons were recorded before.
    for (const w of weapons) {
      const prev = previousById.get(w.id)
      if (!prev?.icon) continue
      w.icon = prev.icon
      const prevRef = prev.sourceRefs?.find((r) => r.id === iconSourceId(w.id))
      if (prevRef) {
        w.sourceRefs.push(prevRef)
        iconSources.push(prevRef)
      }
    }
  } else {
    const files = [...new Set(iconFileById.values())]
    console.log(`Resolving ${files.length} icon files ...`)
    const infoByFile = await resolveImages(files)
    const toDownload: { id: string; info: ImageInfo }[] = []
    for (const w of weapons) {
      const file = iconFileById.get(w.id)
      const prev = previousById.get(w.id)
      const info = file ? infoByFile.get(file) : undefined
      if (!file || !info) {
        console.warn(`  warning: no icon for ${w.id}${file ? ` (could not resolve "${file}")` : ' (no Icon image on the page)'}`)
        if (prev?.icon && (await fileExists(iconPath(w.id)))) w.icon = prev.icon // never replace data with worse data
        continue
      }
      if (!info.mime.startsWith('image/png')) {
        console.warn(`  warning: icon for ${w.id} is ${info.mime || 'an unknown type'}, expected image/png; skipped`)
        if (prev?.icon && (await fileExists(iconPath(w.id)))) w.icon = prev.icon
        continue
      }
      w.icon = { file, sha1: info.sha1 }
      const upToDate = prev?.icon?.sha1 === info.sha1 && (await fileExists(iconPath(w.id)))
      if (!upToDate) toDownload.push({ id: w.id, info })
    }

    if (options.dryRun) {
      console.log(`Dry run: would download ${toDownload.length} icon(s) to ${path.relative(REPO_ROOT, ICON_DIR)}.`)
    } else if (toDownload.length > 0) {
      console.log(`Downloading ${toDownload.length} icon(s) ...`)
      await fs.mkdir(ICON_DIR, { recursive: true })
      for (const { id, info } of toDownload) {
        const w = weapons.find((x) => x.id === id)!
        try {
          await fs.writeFile(iconPath(id), await downloadImage(info))
        } catch (error) {
          console.warn(`  warning: icon for ${id} not saved: ${error instanceof Error ? error.message : String(error)}`)
          const prev = previousById.get(id)
          if (prev?.icon && (await fileExists(iconPath(id)))) w.icon = prev.icon
          else delete w.icon
        }
        await sleep(DELAY_MS)
      }
    }

    const previousIconRetrieved = new Map<string, string>()
    for (const prev of previousWeapons) {
      const ref = prev.sourceRefs?.find((r) => r.id === iconSourceId(prev.id))
      if (ref && prev.icon) previousIconRetrieved.set(`${ref.id}@${prev.icon.sha1}`, ref.retrievedOn)
    }
    for (const w of weapons) {
      if (!w.icon) continue
      const id = iconSourceId(w.id)
      const ref: SourceRef = {
        id,
        label: `Endfield Talos Wiki ${w.icon.file} (weapon icon)`,
        url: `${WIKI_BASE}/wiki/File:${encodeURIComponent(w.icon.file.replace(/ /g, '_'))}`,
        retrievedOn: previousIconRetrieved.get(`${id}@${w.icon.sha1}`) ?? today,
        confidence: 'community',
        notes: `sha1 ${w.icon.sha1}. Saved as public/weapons/${w.id}.png.`,
      }
      w.sourceRefs.push(ref)
      iconSources.push(ref)
    }
  }

  const categorySource: SourceRef = {
    id: 'wiki-gg-category-weapons',
    label: 'Endfield Talos Wiki Weapons category (MediaWiki API)',
    url: `${WIKI_BASE}/wiki/${CATEGORY}`,
    retrievedOn: today,
    confidence: 'community',
    notes:
      'Weapon list discovered from Category:Weapons. Each weapon is parsed from its page: the Weapon infobox ' +
      '(rarity, type, internal name, icon image) and the Weapon skill template (the three essence stats).',
  }
  const sources = [categorySource, ...pageSources, ...iconSources].sort((a, b) => a.id.localeCompare(b.id))

  const hash = contentHash({ weapons, gaps, sources })
  const previousManifest = await readJson<{ contentHash?: string }>(FILES.manifest)
  const unchanged = previousManifest?.contentHash === hash

  const byType: Record<string, number> = {}
  for (const w of weapons) byType[w.type] = (byType[w.type] ?? 0) + 1
  console.log(`Parsed ${weapons.length} weapons (${Object.entries(byType).map(([t, n]) => `${t}: ${n}`).join(', ')}).`)
  console.log(`Gaps: ${gaps.length}${gaps.length ? '' : ' (none)'}`)
  for (const g of gaps) console.log(`  - ${g.subject}: ${g.field}: ${g.problem}`)
  if (skipped.length) console.log(`Skipped non-weapon pages: ${skipped.join(', ')}`)

  if (unchanged) {
    console.log('No content changes since the last sync; nothing written.')
    return
  }
  if (options.dryRun) {
    console.log('Dry run: nothing written.')
    return
  }

  const manifest = {
    catalogId: options.gameVersion ? `${today}-v${options.gameVersion}` : today,
    snapshotDate: today,
    ...(options.gameVersion ? { gameVersion: options.gameVersion } : {}),
    source: { name: 'Endfield Talos Wiki', url: WIKI_BASE },
    files: { weapons: 'weapons.json', sources: 'sources.json', gaps: 'gaps.json' },
    counts: { weapons: weapons.length, sources: sources.length, gaps: gaps.length },
    contentHash: hash,
    notes: [
      'Generated by scripts/sync-weapons.ts from the Endfield Talos Wiki (endfield.wiki.gg) through the MediaWiki API. Do not edit by hand; re-run `npm run sync:weapons`.',
      'A weapon essence is its three skills: slot1 main attribute, slot2 sub stat, slot3 skill stat. 3-star weapons have no slot2.',
      'Weapons that could not be parsed are listed in gaps.json and excluded from weapons.json.',
    ],
  }

  locale.weapons = Object.fromEntries(weapons.map((w) => [w.id, titleById.get(w.id)!]))

  await fs.writeFile(FILES.weapons, toJsonText(weapons))
  await fs.writeFile(FILES.sources, toJsonText({ sources }))
  await fs.writeFile(FILES.gaps, toJsonText({ gaps }))
  await fs.writeFile(FILES.manifest, toJsonText(manifest))
  await fs.writeFile(LOCALE_PATH, toJsonText(locale))
  console.log(`Wrote ${path.relative(REPO_ROOT, DATA_DIR)}/{weapons,sources,gaps,manifest}.json and the weapons map in src/locales/en.json. Icons are in public/weapons/.`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
