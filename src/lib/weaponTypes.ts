/** Preferred display order of weapon types; unknown types (from a future sync) follow alphabetically. */
export const WEAPON_TYPE_ORDER: readonly string[] = ['sword', 'great_sword', 'polearm', 'handcannon', 'arts_unit']

/** Distinct weapon type ids present in the data, in a stable order. */
export function weaponTypeOptions(weapons: ReadonlyArray<{ type?: string }>): string[] {
  const present = new Set<string>()
  for (const w of weapons) if (w.type) present.add(w.type)
  const known = WEAPON_TYPE_ORDER.filter((t) => present.has(t))
  const extra = [...present].filter((t) => !WEAPON_TYPE_ORDER.includes(t)).sort()
  return [...known, ...extra]
}
