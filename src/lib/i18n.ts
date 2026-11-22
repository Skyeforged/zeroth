import en from '@/locales/en.json'
import type { Id, Locale, NameKind } from '@/types/data'

const locale: Locale = en

/** Display name for an id. Falls back to the raw id so missing names are visible, not blank. */
export function nameOf(kind: NameKind, id: Id): string {
  return locale[kind]?.[id] ?? id
}

export { locale }
