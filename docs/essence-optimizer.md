# Essence Farming Optimizer

Route: `/#/essence/optimizer`. View: `src/features/essence/views/OptimizerView.vue`. Store: `src/features/essence/stores/optimizer.ts`. Logic: `src/features/essence/lib/optimizer.ts` (pure, no Vue).

## Purpose

The user picks the weapons (or custom essences) they want to farm essences for. The app ranks **Energy Alluviums** (the farmable locations) by how well they can produce those essences and recommends a **pre-engrave**. The design is inspired by the Weapon Essence Solver on endfieldtools.dev (based on screenshots the user provided; the site is client-rendered and cannot be fetched).

## Game rules (user-confirmed)

- Each Energy Alluvium has a pool of **8 slot-2 stats and 8 slot-3 stats** (`EnergyAlluvium.slot2Pool`, `EnergyAlluvium.slot3Pool`). Any main stat (slot 1) can drop.
- **Engraving (pre-engrave) is per Energy Alluvium:** pick **3 of the 5** main stats for slot 1, plus **exactly one locked stat in total**, taken from the alluvium's slot-2 stats **or** its slot-3 stats (not both). The lock guarantees that stat and restricts that slot to it. The other slot still rolls from its 8.
- **The optimizer always assumes engraving is used.** There is no "without engraving" mode (the user chose this to keep things simple).
- Constants: `ENGRAVING_MAIN_PICKS = 3`, `POOL_SIZE = 8` in `src/features/essence/lib/constants.ts`.

## Targets

A `Target` (`src/features/essence/lib/optimizer.ts`) is `{ id, label, essence, onlySlot3, priority, custom }`.

- **Weapons:** selected in the optimizer (`selectedIds`). Their essence comes from `weapons.json`.
- **Custom essences:** user-defined slot 1/2/3 stats with an optional name (`CustomEssence` in the store). They are always targets until removed (the X deletes them) and are saved with the selection.
- **Priority star:** marks a target Priority (x2 points) vs Average. Stored in `priorityIds` (works for weapons and custom essences). The card shows it with the filled star and a yellow border only (no Priority/Average tag). Target cards list the stats as bordered, tinted chips colour-coded by slot (the same `StatChip.vue` as the pre-engrave strip) (Primary blue, Secondary cyan, Skill purple; CSS vars `--slot1-color` to `--slot3-color` in `main.css`, shared with the Tracker).
- **Shield ("only slot 3 matters"):** for support weapons that only need their 3rd line (skill) right. Slot 1 and 2 are ignored, so its main stat does not compete for engraving picks. Stored in the optimizer store's `shieldIds` (works for weapons and custom essences, like `priorityIds`); not part of the Tracker data or its export. Removing a target also clears its shield.

## Scoring algorithm (`bestForAlluvium`, `rankAlluviums`)

For each Energy Alluvium, brute force **every engraving**: 10 main-stat subsets (C(5,3)) x 16 locks (8 slot-2 + 8 slot-3 stats) = 160 combinations.

1. **Per slot "can drop"** under the engraving (`slotsThatCanDrop`):
   - slot 1: the target's slot-1 stat is in the 3 picked main stats.
   - slot 2: stat is in `slot2Pool`, and if the lock is in slot 2 it must equal the locked stat.
   - slot 3: stat is in `slot3Pool`, and if the lock is in slot 3 it must equal the locked stat.
2. **Match level** = number of *required* slots that can drop. Normal targets require all 3 slots: 3/3 = `perfect`, 2/3 = `good`, 1/3 = `partial`, 0 = no match. **3-star weapons have no slot 2**, so they require only slots 1 and 3 (`essenceSlots`): both can drop = `perfect`, one = `good`, none = no match; a missing slot 2 is never a lockable stat. Shield targets require only slot 3: it can drop = `perfect`, else no match.
3. **Points per target:** perfect `SCORE_PERFECT = 10`, good `SCORE_GOOD = 2`, partial `SCORE_PARTIAL = 0.5`, multiplied by `PRIORITY_MULTIPLIER = 2` for Priority targets. (Constants in `src/features/essence/lib/constants.ts`.) The scoring values were given by the user.
4. **Best engraving per Energy Alluvium** = highest total points. Ties, in order: more perfect matches, a "meaningful" lock (some target actually needs that stat in that slot), fewer required main-stat picks, then first found.
5. `requiredMain` = distinct slot-1 stats that actually matter for the counted matches (the rest of the 3 picks display as `[Any]`).
6. `altLocks` = other meaningful locks with the same points, perfect count and required main stats (shown as "A or B").
7. **Ranking:** Energy Alluviums sorted by points desc, then perfect count desc, then alluvium id.

Output per Energy Alluvium (`AlluviumResult`): `alluviumId`, `points`, `perfect[]`, `good[]`, `partial[]` (`TargetMatch` = target, level, which slots can drop, required slots, points), `engraving | null`, `altLocks`. `engraving` is `null` when nothing matches.

## UI

- **Select Your Weapons** panel: target cards (`TargetCard.vue`) with star, shield, remove; Clear (n); a tip banner about the shield; "Add Weapons" (searchable list, **Hide completed** toggle, "Add all shown") and "Add custom essence" (`CustomEssenceForm.vue`).
  - Hide completed only filters the Add Weapons list; already selected cards stay.
  - The Add Weapons list is a **grid of tiles** (`src/features/essence/components/WeaponTile.vue`: icon, name, status tag; essence stats in the tooltip). Tiles and icons are coloured by rarity (`src/lib/rarity.ts`: 3 blue, 4 purple, 5 gold, 6 orange; coloured border, plus an "N★" text label) and the grid is sorted by rarity (highest first), then name. Clicking a tile adds the weapon; selected weapons are not shown. A **weapon type filter** row ("All types" plus one button per type from `weaponTypeOptions`, `src/lib/weaponTypes.ts`) combines with search and Hide completed, and "Add all shown" only adds what the filters show. The type filter is not persisted.
- **Best Energy Alluviums** panel: `AlluviumResultCard.vue` per alluvium. The top one with points > 0 gets a trophy "Best Energy Alluvium to Farm" banner and a points badge. Sections: Priority Weapon Match, Other Perfect Matches, each with a stat chip per required slot (`StatChip.vue`, check or cross).
  - **Current essence level:** on every card, each matched weapon's stat chips show the user's current Tracker level for that slot as a mono `+N` badge (`MAX` in green at the slot max, `LEVEL_MAX`). Unobtained weapons show a small "Not owned" label next to the name and no levels; custom essences show neither. The view passes `progressOf` (`tracker.get`) so the card stays presentational. Display only: it does not affect scoring or ranking.
- Weapon icons (`WeaponIcon.vue`) appear on target cards, in the Add Weapons list and next to each match in the Energy Alluvium cards. Custom essences and weapons without an icon show none.
- **"Show 1/3 and 2/3 matches"** checkbox (default off, `showPartial`) reveals good and partial matches. They **always count toward the score**, only the display is gated.
- **Recommended Pre-Engrave** strip (`PreEngraveStrip.vue`): required main stats padded with `[Any]` up to 3, `+` the locked stat, `or` alternative locks. Chips are colour-coded by slot (main stats blue, a slot-2 lock cyan, a slot-3 lock purple), so there is no "(slot N)" text.

## Persistence

`useOptimizerStore` (`src/features/essence/stores/optimizer.ts`), localStorage key **`zeroth:optimizer`** (the version lives inside the save). Saved as the envelope `{ version: 1, data }` (`OPTIMIZER_SAVE_VERSION`), with `data` = `selectedIds`, `priorityIds`, `shieldIds`, `customEssences`, `hideCompleted`, `showPartial`. Shape, sanitizer, defaults and migrations (`optimizerMigrations`, none yet) live in `src/features/essence/lib/optimizerSave.ts` (`parseOptimizerSave`, `defaultOptimizerState`); the save is written back on load (see "Saves and migrations" in [README.md](./README.md)).

## Deliberately not included

- The site's "Pre-Engrave settings" button and "Import Missing from Cheat Sheet".
- Chance/probability-based ranking.
- An enemy/boss name on Energy Alluvium cards (could be an optional field in `alluviums.json` later).

## Tests

`src/features/essence/lib/__tests__/optimizer.spec.ts`: perfect/good/partial points, pool requirements, Priority doubling, lock sharing, 3-main-stat limit, shield targets (ignores slots 1/2, takes no main-stat pick), ranking order, null engraving, alternative locks. `src/features/essence/lib/__tests__/optimizerSave.spec.ts`: current envelope sanitized, defaults, non-envelope gives `null`, newer version flagged.

## Rules for changes

- Do not change the engraving rule, scoring values or match definition without asking the user.
- Keep `optimizer.ts` free of Vue/store imports so it stays unit-testable; the view builds `Target[]` and passes `stats.slot1` as the main-stat list.
- If you change scoring constants or storage keys, update this doc.
