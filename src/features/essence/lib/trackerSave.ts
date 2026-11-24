import { sanitizeProgress, type WeaponProgress } from '@/features/essence/lib/tracker'
import { isPlainObject, migrate, type Migrations } from '@/lib/versioned'
import type { Id } from '@/types/data'

/** Current tracker save version (localStorage and Export JSON). Bump it and add a migration step when the shape changes. */
export const TRACKER_SAVE_VERSION = 1

/** Migration steps keyed by from-version (none yet). */
export const trackerMigrations: Migrations = {}

/**
 * Parse a tracker save or export of any version into current progress. `null` = not a save envelope.
 * `future` = saved by a newer app version (best-effort parse; do not write it back on load).
 */
export function parseTrackerSave(raw: unknown): { progress: Record<Id, WeaponProgress>; future: boolean } | null {
  const migrated = migrate(raw, TRACKER_SAVE_VERSION, trackerMigrations)
  if (!migrated) return null
  const { data, future } = migrated
  const progress: Record<Id, WeaponProgress> = {}
  if (isPlainObject(data)) {
    for (const [id, value] of Object.entries(data)) {
      const p = sanitizeProgress(value)
      if (p) progress[id] = p
    }
  }
  return { progress, future }
}
