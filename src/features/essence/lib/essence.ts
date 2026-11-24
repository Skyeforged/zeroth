import { SLOTS, type Essence, type Slot } from '@/types/data'

/** The slots an essence actually has (3-star weapons have no slot 2). */
export function essenceSlots(essence: Essence): Slot[] {
  return SLOTS.filter((slot) => essence[slot] !== undefined)
}

/** The stat ids of an essence in slot order, skipping a missing slot. */
export function essenceStats(essence: Essence): string[] {
  return essenceSlots(essence).map((slot) => essence[slot]!)
}
