# Essence Tracker

Route: `/#/essence/tracker`. View: `src/features/essence/views/TrackerView.vue`. Store: `src/features/essence/stores/tracker.ts`. Logic: `src/features/essence/lib/tracker.ts` (progress model, status) and `src/features/essence/lib/trackerSave.ts` (save parsing, migrations).

## Purpose

A list of every weapon in the game, the essence each one needs, and the user's progress on it: whether the essence is obtained and the enhancement level of each of its 3 stats.

## Game rules (user-confirmed)

An essence has 3 slots:

| Slot | Meaning | Options |
| --- | --- | --- |
| `slot1` | Main stat (Agility, Strength, Will, Intellect, Main Attribute) | exactly 5 |
| `slot2` | Sub stat (Crit chance, Arts intensity, ...) | 10+ |
| `slot3` | Skill (Flow, Assault, ...) | 10+ |

Stat ids (`src/data/stats.json`; display names in `src/locales/en.json`, spelled as in the game):

- **slot1 (5):** `agility`, `strength`, `will`, `intellect`, `main_attribute`
- **slot2 (12):** `atk`, `hp`, `physical_dmg`, `heat_dmg`, `electric_dmg`, `cryo_dmg`, `nature_dmg`, `critical_rate`, `arts_intensity`, `ult_efficiency`, `arts_dmg`, `treatment_efficiency`
- **slot3 (14):** `assault`, `suppression`, `pursuit`, `crusher`, `inspiring`, `combative`, `brutality`, `infliction`, `medicant`, `fracture`, `detonate`, `twilight`, `flow`, `efficacy`

- **3-star weapons have no slot 2** (two skills only: a main attribute and a slot-3 skill). Their `essence.slot2` is absent; the Tracker shows "n/a" for it. Slot 1 and slot 3 are always present.
- Each weapon needs **one specific essence**: a fixed stat in each of the 3 slots (`Weapon.essence`).
- Level scale per stat: **slot 1 and slot 2: 1-6; slot 3: 1-3**. The minimum is 1 for every slot (`LEVEL_MIN`, `LEVEL_MAX` in `src/features/essence/lib/constants.ts`).

## Data model (`WeaponProgress`)

```ts
{
  levels: { slot1, slot2, slot3 }        // each defaults to 1 (the minimum), clamped to the scale
  completed: boolean                     // user marks Completed (the only way to be completed)
}
```

- **Obtained = has a record.** There is no `obtained` flag: a weapon with no record is unobtained, a weapon with a record is obtained. `defaultProgress()` is the record created on obtaining (levels 1, not completed).
- `defaultProgress()`, `clampLevel()` and `sanitizeProgress()` live in `src/features/essence/lib/tracker.ts`. `sanitizeProgress` repairs one record (clamps levels) and returns `null` for non-objects.
- Levels default to 1 because 1 is the minimum.

## Status rules (`deriveStatus`)

| Status | Rule |
| --- | --- |
| `unobtained` | no record (`deriveStatus(undefined)`) |
| `obtained` | has a record, not `completed`. Labelled "Obtained" (Obtained and Can be Improved are **one** status) |
| `completed` | has a record with `completed`. **Manual only**: maxed levels (6, 6, 3) do not complete a weapon |

Labels come from `STATUS_LABEL`. `StatusTag.vue` renders the status (Optimizer tiles and Tracker cards).

Rules, enforced in `tracker.update(id, { obtained?, completed? })`: `obtained: false` **deletes the record** (its levels and completed flag are discarded); `obtained: true` or `completed: true` creates the record if missing (so marking completed implies obtained). `setLevel` does nothing for an unobtained weapon.

## Persistence

- Pinia store `useTrackerStore` (`src/features/essence/stores/tracker.ts`), localStorage key **`zeroth:tracker`** (the version lives inside the save).
- Saved as the versioned envelope `{ version: 1, data: Record<weaponId, WeaponProgress> }` (`TRACKER_SAVE_VERSION`). Only obtained weapons are stored; `get(id)` returns `undefined` for unobtained ones. **Export JSON is the same envelope.**
- Loading and Import both go through `parseTrackerSave` (`src/features/essence/lib/trackerSave.ts`): migrate to the current version (`trackerMigrations`, none yet), then sanitize each entry. It returns `null` for a file without an envelope; Import then fails with "Not a tracker save file". The save is written back on load (see "Saves and migrations" in [README.md](./README.md)).
- Actions: `get`, `update(id, patch)`, `setLevel(id, slot, level)`, `exportJson`, `importJson` (throws on invalid JSON or a non-save file), `reset`.
- Keys are weapon ids, so renaming display names in the locale does not lose progress.

## UI

- Essence level (`StatLevel.vue`), styled after the in-game "Essence Stats" panel: a name row (hollow bullet in the slot colour: Primary = blue, Secondary = teal, Skill = magenta; stat name; hairline rule), then a rounded track sized to its segments (one fixed-width slanted segment per level up to the slot's max, so at most 6; filled segments are Endfield yellow), with a divider and mono `+N` readout right-aligned at the row's end (`MAX` in green at max level). Click a segment to set that level; clicking the top filled segment steps down one (never below `LEVEL_MIN`). The track is a `role="slider"`: arrow keys step, Home/End jump to min/max. No free typing; disabled until obtained; 3-star slot 2 shows n/a.
- Card grid (the only layout): one `TrackerCard.vue` per weapon (~19rem min so a ~15-character name word fits, auto-fill): rarity-coloured top bar, 56px icon (`WeaponIcon.vue`, from `public/weapons/`), name (up to 2 lines), rarity stars, `StatusTag`, two borderless icon toggles (`IconToggle.vue`, native `title` tooltip, tinted when on): "Obtained" and "Mark completed" (also marks the weapon obtained), then the three `StatLevel`s stacked (slot meaning in each one's tooltip). Completed cards get a green left accent; unobtained cards have a dimmed header. The card is presentational and emits `level` / `update`; the view writes to the store.
- Sorting is fixed (no user sorting): rarity (highest first), then name.
- Search by weapon name, filter by status, summary counts (unobtained / obtained / completed).
- Export / Import progress as JSON, Reset (with confirm).

## Link to the optimizer

The optimizer's shield ("only slot 3 matters") is **not** tracker data: it lives in the optimizer store (`shieldIds`) and is not in the tracker's localStorage or Export JSON. See [essence-optimizer.md](./essence-optimizer.md).

## Tests

`src/features/essence/lib/__tests__/tracker.spec.ts`: no record = unobtained, record = obtained, no auto-complete at max, manual complete, sanitize clamping, invalid input gives `null`. `src/features/essence/lib/__tests__/trackerSave.spec.ts`: `parseTrackerSave` (current envelope passes through with invalid entries dropped; non-envelope gives `null`; newer version flagged). `src/lib/__tests__/versioned.spec.ts` covers the generic migration chain.
