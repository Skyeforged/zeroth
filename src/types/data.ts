/** Unique snake_case identifier, e.g. `atk_boost`. */
export type Id = string

export const SLOTS = ['slot1', 'slot2', 'slot3'] as const
export type Slot = (typeof SLOTS)[number]

/** Stat ids available per slot. */
export type StatsData = Record<Slot, Id[]>

/** A complete essence: a stat in every slot (used by custom essences). */
export type FullEssence = Record<Slot, Id>

/** A weapon's essence. 3-star weapons have no slot-2 sub stat. */
export interface Essence {
  slot1: Id
  slot2?: Id
  slot3: Id
}

export type Confidence = 'official' | 'community' | 'guide_site' | 'manual_override'

/** Where a value came from (see docs/data-sync.md). */
export interface SourceRef {
  id: Id
  label: string
  url: string
  retrievedOn: string
  confidence: Confidence
  revisionId?: number
  notes?: string
}

/** Weapon icon downloaded by the sync script to `public/weapons/<id>.png`. */
export interface WeaponIcon {
  /** Wiki file name, e.g. `Mountain Bearer icon.png`. */
  file: string
  /** sha1 of the image as reported by the wiki (change detection; may not match the local file's bytes). */
  sha1: string
}

export interface Weapon {
  id: Id
  /** The wiki's internal name, e.g. `wpn_lance_0012`. */
  internalName?: string
  rarity?: number
  /** Weapon type id, e.g. `great_sword`. */
  type?: string
  /** The one essence this weapon needs: a fixed stat in each slot (no slot 2 for 3-star weapons). */
  essence: Essence
  /** Present when the icon was downloaded; the file is `weapons/<id>.png` under `public/`. */
  icon?: WeaponIcon
  sourceRefs?: SourceRef[]
}

export interface EnergyAlluvium {
  id: Id
  /** The 8 slot-2 stats this alluvium can drop. */
  slot2Pool: Id[]
  /** The 8 slot-3 stats this alluvium can drop. */
  slot3Pool: Id[]
  /** Present on synced data (see docs/data-sync.md). */
  sourceRefs?: SourceRef[]
}

export type NameKind = 'stats' | 'weapons' | 'weaponTypes' | 'alluviums'
export type Locale = Record<NameKind, Record<Id, string>>
