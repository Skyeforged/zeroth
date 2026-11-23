# Essence Tracker

Route: `/#/tracker` (default). View: `src/views/TrackerView.vue`. Store: `src/stores/tracker.ts`. Logic: `src/lib/status.ts`.

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

- **3-star weapons have no slot 2** (two skills only: a main attribute and a slot-3 skill). Their `essence.slot2` is absent; the Tracker shows "n/a" for it, and completion ignores slot 2 (`deriveStatus(progress, essenceSlots(weapon.essence))`). Slot 1 and slot 3 are always present.
- Each weapon needs **one specific essence**: a fixed stat in each of the 3 slots (`Weapon.essence`).
- Level scale per stat: **slot 1 and slot 2: 1-6; slot 3: 1-3**. The minimum is 1 for every slot (`LEVEL_MIN`, `LEVEL_MAX` in `src/lib/constants.ts`).

## Data model (`WeaponProgress`)

```ts
{
  obtained: boolean                      // separate flag; default false
  levels: { slot1, slot2, slot3 }        // each defaults to 1 (the minimum), clamped to the scale
  completedOverride: boolean             // user manually marks Completed
  onlySlot3: boolean                     // "shield": optimizer only needs this weapon's slot-3 stat
}
```

- `defaultProgress()`, `clampLevel()` and `sanitizeProgress()` live in `src/lib/status.ts`. `sanitizeProgress` repairs untrusted input (localStorage, imports).
- Unobtained is a **separate flag**, not "level is empty". Levels default to 1 because 1 is the minimum.

## Status rules (`deriveStatus`)

| Status | Rule |
| --- | --- |
| `unobtained` | `obtained === false` (levels are ignored) |
| `obtained` | `obtained === true`. Labelled "Obtained" (Obtained and Can be Improved are **one** status) |
| `completed` | `obtained` and (all levels at max (6, 6, 3) **or** `completedOverride`). Automatic at max, with a manual override |

Labels come from `STATUS_LABEL`. `StatusTag.vue` renders the status (Optimizer tiles and Tracker cards).

Coupling rules, enforced in `tracker.update`: setting `completedOverride: true` also sets `obtained: true`; setting `obtained: false` also clears `completedOverride`.

## Persistence

- Pinia store `useTrackerStore` (`src/stores/tracker.ts`), localStorage key **`zeroth:tracker:v1`**.
- Stored as `Record<weaponId, WeaponProgress>`; only weapons the user touched are stored, everything else uses defaults (`get(id)`).
- Actions: `get`, `update(id, patch)`, `setLevel(id, slot, level)`, `exportJson`, `importJson` (throws on invalid JSON), `reset`.
- Keys are weapon ids, so renaming display names in the locale does not lose progress.

## UI

- Essence level (`StatLevel.vue`), styled after the in-game "Essence Stats" panel: a name row (hollow bullet in the slot colour: Primary = blue, Secondary = teal, Skill = magenta; stat name; hairline rule), then a rounded track sized to its segments (one fixed-width slanted segment per level up to the slot's max, so at most 6; filled segments are Endfield yellow), with a divider and mono `+N` readout right-aligned at the row's end (`MAX` in green at max level). Click a segment to set that level; clicking the top filled segment steps down one (never below `LEVEL_MIN`). The track is a `role="slider"`: arrow keys step, Home/End jump to min/max. No free typing; disabled until obtained; 3-star slot 2 shows n/a.
- Card grid (the only layout): one `TrackerCard.vue` per weapon (~19rem min so a ~15-character name word fits, auto-fill): rarity-coloured top bar, 56px icon (`WeaponIcon.vue`, from `public/weapons/`), name (up to 2 lines), rarity stars, `StatusTag`, two borderless icon toggles (`IconToggle.vue`, native `title` tooltip, tinted when on): "Obtained" and "Mark completed" (also marks the weapon obtained), then the three `StatLevel`s stacked (slot meaning in each one's tooltip). Completed cards get a green left accent; unobtained cards have a dimmed header. The card is presentational and emits `level` / `update`; the view writes to the store.
- `onlySlot3` has no control in the Tracker; it is edited only through the shield on Optimizer target cards.
- Sorting is fixed (no user sorting): rarity (highest first), then name.
- Search by weapon name, filter by status, summary counts (unobtained / obtained / completed).
- Export / Import progress as JSON, Reset (with confirm).

## Link to the optimizer

`onlySlot3` is the **same flag** as the shield on optimizer target cards (single source of truth: `tracker.update(id, { onlySlot3 })`). See [essence-optimizer.md](./essence-optimizer.md).

## Tests

`src/lib/__tests__/status.spec.ts`: default status, obtained, auto-complete at max, manual complete, unobtained ignores levels, sanitize clamping.
