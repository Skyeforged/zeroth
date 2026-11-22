/**
 * Interactive terminal tool to enter the slot-2 pool (8 of the 12 secondary stats) of each Energy Alluvium.
 * See docs/data-sync.md ("Entering slot 2 pools").
 *
 *   npm run edit:alluviums
 *
 * Arrow keys move, space toggles a stat, enter activates "Save" / "Copy" / "Back".
 * Only the chosen alluvium's `slot2Pool` is changed in src/data/alluviums.json; every other field and entry is
 * preserved. Nothing is written until you choose "Save".
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { POOL_SIZE, poolStatus } from './lib/slot2-input'
import { interact, select, style } from './lib/terminal-menu'

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const ALLUVIUMS_PATH = path.join(REPO_ROOT, 'src', 'data', 'alluviums.json')
const STATS_PATH = path.join(REPO_ROOT, 'src', 'data', 'stats.json')
const LOCALE_PATH = path.join(REPO_ROOT, 'src', 'locales', 'en.json')

interface AlluviumRecord {
  id: string
  slot2Pool: string[]
  slot3Pool: string[]
  [key: string]: unknown
}

/** Deterministic JSON text: 2-space indent and a trailing newline (same as the sync scripts). */
const toJsonText = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`

async function main() {
  if (!process.stdin.isTTY) {
    throw new Error('This tool is interactive; run it from a terminal (npm run edit:alluviums).')
  }

  const stats = JSON.parse(await fs.readFile(STATS_PATH, 'utf8')) as { slot2: string[] }
  const locale = JSON.parse(await fs.readFile(LOCALE_PATH, 'utf8')) as Record<string, Record<string, string>>
  const alluviums = JSON.parse(await fs.readFile(ALLUVIUMS_PATH, 'utf8')) as AlluviumRecord[]
  if (alluviums.length === 0) throw new Error('alluviums.json is empty; run `npm run sync:alluviums` first.')

  const options = stats.slot2
  const statName = (id: string) => locale.stats?.[id] ?? id
  const alluviumName = (id: string) => locale.alluviums?.[id] ?? id

  let lastId: string | undefined
  let notice = ''

  for (;;) {
    // Incomplete alluviums first, then by id.
    const order = [...alluviums].sort(
      (a, b) =>
        Number(a.slot2Pool.length === POOL_SIZE) - Number(b.slot2Pool.length === POOL_SIZE) || a.id.localeCompare(b.id),
    )
    const allDone = order.every((a) => a.slot2Pool.length === POOL_SIZE)
    const initial = Math.max(order.findIndex((a) => a.id === lastId), 0)
    const picked = await select(
      `Energy Alluviums (slot 2 pool)${allDone ? ' - all complete' : ''}${notice ? `  ${notice}` : ''}`,
      order.map((a) => `${alluviumName(a.id)}  [${poolStatus(a.slot2Pool)}]`),
      initial,
    )
    notice = ''
    if (picked === null) break
    const target = order[picked]!
    lastId = target.id

    if (await editPool(target, alluviums, options, statName, alluviumName)) {
      await fs.writeFile(ALLUVIUMS_PATH, toJsonText(alluviums))
      notice = `(saved ${alluviumName(target.id)})`
    }
  }
}

/** Checklist screen for one alluvium. Returns `true` when the user saved (target.slot2Pool is updated). */
async function editPool(
  target: AlluviumRecord,
  alluviums: AlluviumRecord[],
  options: string[],
  statName: (id: string) => string,
  alluviumName: (id: string) => string,
): Promise<boolean> {
  const selected = new Set(target.slot2Pool)
  // Rows: one per stat, then the actions.
  const rows = options.length
  const COPY = rows
  const SAVE = rows + 1
  const BACK = rows + 2
  let index = 0
  let message = ''

  for (;;) {
    // Held in an object so TypeScript does not narrow it after the callback-based `interact`.
    const outcome: { value: 'copy' | 'save' | 'back' } = { value: 'back' }
    await interact(
      () => {
        const lines = [
          style.bold(alluviumName(target.id)),
          style.dim(`Slot 3 pool (reference): ${target.slot3Pool.map(statName).join(', ')}`),
          `Slot 2 stats: pick exactly ${POOL_SIZE} (selected ${selected.size}/${POOL_SIZE})`,
        ]
        const row = (i: number, text: string) => (i === index ? style.cursor(`> ${text}`) : `  ${text}`)
        options.forEach((id, i) => lines.push(row(i, `[${selected.has(id) ? 'x' : ' '}] ${statName(id)}`)))
        lines.push(row(COPY, 'Copy pool from another alluvium...'))
        lines.push(row(SAVE, 'Save'))
        lines.push(row(BACK, 'Back (discard changes)'))
        lines.push(message ? `\x1b[33m${message}\x1b[0m` : style.dim('up/down move, space toggle, enter select, esc back'))
        return lines
      },
      ({ name }) => {
        message = ''
        const count = BACK + 1
        if (name === 'up') index = (index + count - 1) % count
        else if (name === 'down') index = (index + 1) % count
        else if (name === 'escape') return true
        else if ((name === 'space' || name === 'return') && index < rows) {
          const id = options[index]!
          if (!selected.delete(id)) selected.add(id)
        } else if (name === 'return' && index === COPY) {
          outcome.value = 'copy'
          return true
        } else if (name === 'return' && index === SAVE) {
          if (selected.size !== POOL_SIZE) {
            message = `Pick exactly ${POOL_SIZE} stats (currently ${selected.size}).`
            return
          }
          outcome.value = 'save'
          return true
        } else if (name === 'return' && index === BACK) return true
      },
    )

    if (outcome.value === 'copy') {
      const sources = alluviums.filter((a) => a.id !== target.id && a.slot2Pool.length === POOL_SIZE)
      if (sources.length === 0) {
        message = 'No other alluvium has a complete pool yet.'
        continue
      }
      const choice = await select(
        `Copy slot 2 pool into ${alluviumName(target.id)} from:`,
        sources.map((a) => alluviumName(a.id)),
        0,
        'up/down move, enter copy, esc cancel',
      )
      if (choice !== null) {
        selected.clear()
        for (const id of sources[choice]!.slot2Pool) selected.add(id)
        message = `Copied from ${alluviumName(sources[choice]!.id)}. Choose Save to keep it.`
      }
      index = SAVE
      continue
    }

    if (outcome.value === 'save') {
      target.slot2Pool = options.filter((id) => selected.has(id)) // stats.json order
      return true
    }
    return false
  }
}

main().catch((error) => {
  process.stdout.write('\x1b[?25h')
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
