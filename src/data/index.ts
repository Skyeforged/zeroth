import { locale } from '@/lib/i18n'
import { validateData } from '@/lib/validate'
import type { EnergyAlluvium, StatsData, Weapon } from '@/types/data'
import alluviumsJson from './alluviums.json'
import statsJson from './stats.json'
import weaponsJson from './weapons.json'

export const stats: StatsData = statsJson
// weapons.json and alluviums.json are written by the sync scripts; their string fields (e.g.
// `confidence`) are plain strings in JSON, so cast to the stricter types.
export const weapons = weaponsJson as Weapon[]
export const alluviums = alluviumsJson as EnergyAlluvium[]

export const validation = validateData(stats, weapons, alluviums, locale)
