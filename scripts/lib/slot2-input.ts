/**
 * Pure helpers for the interactive slot-2 entry tool (scripts/edit-alluviums.ts).
 * No terminal, filesystem or Vue code lives here so it can be unit-tested with plain strings.
 */

/** Slot-2 stats per Energy Alluvium (same as `POOL_SIZE` in src/lib/constants.ts). */
export const POOL_SIZE = 8

/** `3/8` style progress text for the menu. */
export function poolStatus(pool: readonly string[], size = POOL_SIZE): string {
  return pool.length === size ? 'done' : `${pool.length}/${size}`
}
