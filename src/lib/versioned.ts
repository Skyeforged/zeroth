/**
 * Versioned save envelopes and step-by-step migrations. Pure (no Vue, no localStorage).
 *
 * Every save is `{ version, data }`. Migrations run one step at a time from the saved version up to
 * the current one, so a user who skipped several app versions is still upgraded correctly.
 * A payload without a valid envelope is not a save.
 */

/** Keyed by the version a step upgrades **from**; each step returns data for `from + 1`. */
export type Migrations = Record<number, (data: unknown) => unknown>

export interface Envelope {
  version: number
  data: unknown
}

export const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

export function wrap(version: number, data: unknown): Envelope {
  return { version, data }
}

function unwrap(raw: unknown): Envelope | null {
  if (!isPlainObject(raw) || !('data' in raw)) return null
  const v = raw.version
  return typeof v === 'number' && Number.isInteger(v) && v >= 1 ? { version: v, data: raw.data } : null
}

/**
 * Unwrap `raw` and migrate it up to `current`. Returns `null` when `raw` is not a save envelope.
 * `future` is true when the save comes from a newer app version: the data is returned unmigrated,
 * and callers must not write it back (an old cached build must not downgrade a newer save).
 */
export function migrate(
  raw: unknown,
  current: number,
  migrations: Migrations,
): { data: unknown; future: boolean } | null {
  const envelope = unwrap(raw)
  if (!envelope) return null
  let { version, data } = envelope
  if (version > current) return { data, future: true }
  while (version < current) {
    const step = migrations[version]
    if (!step) throw new Error(`Missing save migration from version ${version}`)
    data = step(data)
    version++
  }
  return { data, future: false }
}
