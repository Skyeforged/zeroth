import { POOL_SIZE } from '@/lib/constants'
import { SLOTS, type EnergyAlluvium, type Locale, type NameKind, type StatsData, type Weapon } from '@/types/data'

export interface ValidationResult {
  errors: string[]
  warnings: string[]
}

const ID_PATTERN = /^[a-z0-9]+(_[a-z0-9]+)*$/

function checkIds(label: string, ids: string[], errors: string[]) {
  const seen = new Set<string>()
  for (const id of ids) {
    if (!ID_PATTERN.test(id)) errors.push(`${label}: "${id}" is not a snake_case id`)
    if (seen.has(id)) errors.push(`${label}: duplicate id "${id}"`)
    seen.add(id)
  }
}

export function validateData(
  stats: StatsData,
  weapons: Weapon[],
  alluviums: EnergyAlluvium[],
  locale: Locale,
): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  for (const slot of SLOTS) checkIds(`stats.${slot}`, stats[slot], errors)
  checkIds('weapons', weapons.map((w) => w.id), errors)
  checkIds('alluviums', alluviums.map((s) => s.id), errors)

  for (const w of weapons) {
    for (const slot of SLOTS) {
      const stat = w.essence[slot]
      if (stat === undefined) {
        // Only slot 2 may be missing (3-star weapons have no sub stat).
        if (slot !== 'slot2') errors.push(`weapon "${w.id}": missing ${slot} stat`)
        continue
      }
      if (!stats[slot].includes(stat)) errors.push(`weapon "${w.id}": unknown ${slot} stat "${stat}"`)
    }
  }

  for (const s of alluviums) {
    for (const slot of ['slot2', 'slot3'] as const) {
      const pool = slot === 'slot2' ? s.slot2Pool : s.slot3Pool
      if (pool.length !== POOL_SIZE) {
        errors.push(`alluvium "${s.id}": ${slot}Pool has ${pool.length} entries, expected ${POOL_SIZE}`)
      }
      if (new Set(pool).size !== pool.length) errors.push(`alluvium "${s.id}": ${slot}Pool has duplicates`)
      for (const stat of pool) {
        if (!stats[slot].includes(stat)) errors.push(`alluvium "${s.id}": unknown ${slot} stat "${stat}"`)
      }
    }
  }

  const missingName = (kind: NameKind, ids: string[]) => {
    for (const id of ids) {
      if (!locale[kind]?.[id]) warnings.push(`locale: no display name for ${kind} "${id}"`)
    }
  }
  missingName('stats', SLOTS.flatMap((s) => stats[s]))
  missingName('weapons', weapons.map((w) => w.id))
  missingName('alluviums', alluviums.map((s) => s.id))

  return { errors, warnings }
}
