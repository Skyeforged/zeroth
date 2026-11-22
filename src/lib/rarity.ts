/** Cosmetic colour per weapon rarity (stars). Retune the palette here only. */
export const RARITY_COLOR: Record<number, string> = {
  3: '#4aa3ff', // blue
  4: '#a56bff', // purple
  5: '#f5b83d', // gold
  6: '#ff7a33', // orange
}

/** Colour for a rarity, or `undefined` for a missing or unknown rarity (callers then use the neutral border). */
export function rarityColor(rarity?: number): string | undefined {
  return rarity === undefined ? undefined : RARITY_COLOR[rarity]
}
