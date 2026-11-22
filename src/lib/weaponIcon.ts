/** URL of a weapon icon saved by `npm run sync:weapons` in `public/weapons/<id>.png`. `base` is Vite's BASE_URL. */
export function weaponIconUrl(id: string, base: string): string {
  const prefix = base.endsWith('/') ? base : `${base}/`
  return `${prefix}weapons/${id}.png`
}

/** Ids of the weapons that have a downloaded icon. */
export function iconIdSet(weapons: ReadonlyArray<{ id: string; icon?: unknown }>): Set<string> {
  return new Set(weapons.filter((w) => w.icon).map((w) => w.id))
}
