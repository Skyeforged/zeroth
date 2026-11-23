# Docs index (for humans and AI agents)

Frontend-only Vue app for **Arknights: Endfield** with two features:

- [Essence Tracker](./essence-tracker.md): track which weapon essences you own and their stat levels.
- [Essence Farming Optimizer](./essence-optimizer.md): rank Energy Alluviums for the essences you want, with a pre-engrave recommendation.

Game rules in these docs were **confirmed by the user**. Do not guess or change them; if something is unclear, ask the user.

## Stack and hosting

- Vue 3 + Vite + TypeScript, Pinia, Vue Router. No UI component library: our own components live in `src/components/ui/` (see "UI components" below). Icons are inline SVGs (`UiIcon`, set in `src/components/ui/icons.ts`); no icon font or icon package.
- Static SPA, **no SSR**. Router uses **hash history** (`createWebHashHistory`) because GitHub Pages cannot rewrite URLs.
- GitHub Pages project site. `vite.config.ts` sets `base` from `VITE_BASE` (default `/zeroth/`). `.github/workflows/deploy.yml` builds on push to `main` with `VITE_BASE=/<repo-name>/`. The local branch is currently `master`.
- State is stored in `localStorage` only. There is no backend.

## Data contract

All game data is static JSON in `src/data/`, imported at build time through `src/data/index.ts`:

| File | Shape |
| --- | --- |
| `stats.json` | `{ slot1: Id[], slot2: Id[], slot3: Id[] }` (stat ids per slot) |
| `weapons.json` | `{ id, internalName?, rarity?, type?, essence: { slot1, slot2?, slot3 }, icon?: { file, sha1 }, sourceRefs? }[]` (icon image is `public/weapons/<id>.png`) (stat ids; `slot2` absent for 3-star weapons) |
| `alluviums.json` | `{ id, slot2Pool: Id[8], slot3Pool: Id[8] }[]` |

Rules:

- Every entity uses a **unique snake_case id** (for example `atk_boost`, never `"ATK Boost"`). No display names in these files.
- Display names live in `src/locales/en.json` (`{ stats, weapons, weaponTypes, alluviums }` maps of id to name; `weaponTypes` is hand-maintained, the sync only rewrites `weapons`). Always render names through `nameOf(kind, id)` in `src/lib/i18n.ts`. It falls back to the raw id, so a missing name is visible rather than blank.
- `src/lib/validate.ts` (`validateData`) checks: snake_case ids, no duplicates, referenced stat ids exist, each Energy Alluvium pool has exactly 8 entries without duplicates (`POOL_SIZE`), and warns on ids missing from the locale. `App.vue` shows errors and warnings at the top of the page.
- **`stats.json` and the stat names in the locale are real** (taken from the user's screenshot of the in-game essence stat list): 5 slot-1, 12 slot-2 and 14 slot-3 stats. See the list in [essence-tracker.md](./essence-tracker.md). The "None" option in that screenshot is a UI filter, not a stat.
- **`weapons.json` is generated** by `npm run sync:weapons` from the Endfield Talos Wiki, with `sources.json`, `gaps.json` and `manifest.json` recording where every value came from. See [data-sync.md](./data-sync.md). Until the script has been run, `weapons.json` still holds the 6 placeholder `sample_weapon_*` entries. Do not hand-edit the generated files.
- **A weapon's essence has no `slot2` for 3-star weapons** (`Essence` in `src/types/data.ts`: `{ slot1, slot2?, slot3 }`). Slot 1 and slot 3 are always required. Helpers: `essenceSlots` / `essenceStats` in `src/lib/essence.ts`.
- **`alluviums.json` is user-owned.** `npm run sync:alluviums` only adds missing Energy Alluvium locations from the Endfield Talos Wiki (`slot3Pool` filled, `slot2Pool` empty because the wiki has no slot-2 data); the user enters `slot2Pool` by hand and re-runs never overwrite existing entries. See [data-sync.md](./data-sync.md). Until the script has been run it holds `sample_alluvium_*` placeholders. A new entry with an empty `slot2Pool` fails validation (expected 8) until the user fills it. Keep the shape stable (ids only) and change `src/types/data.ts` plus the validator together if it ever changes.

## Where things are

```
src/types/data.ts          Id, Slot, Weapon, EnergyAlluvium, StatsData, Locale
src/data/                  static JSON + index.ts (exports stats, weapons, alluviums, validation)
src/locales/en.json        id -> display name
src/lib/constants.ts       level scale, pool size, engraving rules, scoring constants
src/lib/status.ts          weapon progress model and status derivation
src/lib/optimizer.ts       Energy Alluvium scoring and ranking (pure, no Vue)
src/lib/validate.ts        data validation
src/lib/i18n.ts            nameOf()
src/lib/storage.ts         safe localStorage JSON helpers
src/lib/essence.ts         essenceSlots / essenceStats (3-star weapons have no slot 2)
scripts/sync-weapons.ts    wiki sync (npm run sync:weapons); scripts/lib/weapon-wikitext.ts = pure parsers
scripts/sync-alluviums.ts Energy Alluvium sync (npm run sync:alluviums); scripts/lib/alluvium-wikitext.ts = pure parser
scripts/edit-alluviums.ts   interactive slot-2 pool entry tool (npm run edit:alluviums); scripts/lib/slot2-input.ts = pure helpers
src/data/{sources,gaps,manifest}.json   generated source trail for weapons
src/stores/tracker.ts      tracker progress (Pinia, persisted)
src/stores/optimizer.ts    optimizer selection, priority, custom essences (Pinia, persisted)
src/views/                 TrackerView.vue, OptimizerView.vue
src/components/            TrackerCard, StatLevel, StatusTag, StatChip, TargetCard, CustomEssenceForm, AlluviumResultCard, PreEngraveStrip, WeaponIcon, IconToggle, WeaponTile
src/components/ui/         generic UI kit: UiButton, UiInput, UiSelect, UiTag, UiMessage, UiCard, UiCheckbox, UiIcon (+ icons.ts, types.ts)
src/assets/main.css        design tokens (light + dark via prefers-color-scheme), .tone-* severity classes, .ui-control field style
src/lib/rarity.ts          rarityColor: cosmetic colour per weapon rarity (3 to 6 stars), used by WeaponIcon and WeaponTile
src/lib/weaponTypes.ts     weaponTypeOptions: distinct weapon types in display order (names in locale `weaponTypes`)
src/lib/weaponIcon.ts      icon URL from Vite BASE_URL (`public/weapons/<id>.png`); WeaponIcon renders nothing when a weapon has no icon
src/lib/__tests__/         Vitest specs (status, optimizer, validate, rarity, weaponIcon, weaponTypes)
```

## UI components

- Hand-written, no component library. Build new UI from `src/components/ui/` and extend those before adding one-off styles.
- Theme: CSS custom properties in `src/assets/main.css` (`--bg`, `--surface`, `--surface-2`, `--surface-hover`, `--border`, `--border-strong`, `--text`, `--text-muted`, `--primary`, `--primary-contrast`, `--primary-text`, `--focus-ring`, `--radius`, `--cut`, font stacks `--font-display` / `--font-body` / `--font-mono`, tri-stripe colours `--stripe-y/c/m`, palette shades such as `--blue-400`, and the slot colours `--slot1-color`..`--slot3-color`). Dark values follow `prefers-color-scheme`.
- `Severity` (`primary | secondary | info | success | warn | danger`) maps to global `.tone-*` classes that set `--tone` / `--tone-fill` / `--on-tone`; UiButton, UiTag and UiMessage use them.

### Visual style (Endfield industrial)

- Look: square edges (`--radius: 0`), hazard yellow `--primary` (#ffe600) on near-black (dark) or off-white paper (light), blueprint grid on the body, a giant outlined "ENDFIELD" watermark behind the main area, and `//` prefixes on headings and labels.
- Yellow is for fills, bars and borders only. Yellow **text** must use `--primary-text` (darker amber in light mode for contrast). Focus rings use `--focus-ring`.
- Fonts are self-hosted via `@fontsource` (imported in `src/main.ts`): Barlow Condensed for headings, nav, buttons and table headers (uppercase, letter-spaced); Barlow for body text; JetBrains Mono for numbers, levels and readouts.
- Global utility classes: `.tri-stripe` (yellow/cyan/magenta bar; only on one-off brand spots, the sidebar logo and the page-header plate, never on repeated cards or tiles), `.hatch-bg` (diagonal hatching), `.display` (condensed uppercase), `.readout` (mono counter text).
- Solid UiButtons have a chamfered bottom-right corner (`clip-path`, size `--cut`), so their focus ring is drawn inside. UiCard has yellow/grey corner brackets. `.toolbar` is a slab with a yellow left bar.
- The page header (`// Title` plus a tri-stripe plate) is rendered by `App.vue` from the nav entry matching the current route.
- Icons: `<UiIcon name="plus" />`, sized `1em` so it follows the font-size, always `aria-hidden` (label the parent control). To add one, put its 24x24 stroke markup in `ICONS` in `icons.ts`; `IconName` is derived from the keys, so `icon` props are type-checked.
- UiButton: `label`, `icon` (an `IconName`), `severity`, `variant` (`solid | outlined | text`), `size` (`normal | small`), `disabled`; `aria-*` and `@click` fall through. Toggle buttons are a UiButton with `aria-pressed`.
- UiSelect is a styled native `<select>` (`options: { value, label }[]`, `placeholder`, `clearable` to allow picking the placeholder to reset to null). No search filter; native type-ahead instead.
- Tooltips are native `title` attributes.
- The Tracker is a card grid in `TrackerView.vue` (one `TrackerCard.vue` per weapon).

## Keeping these docs current

When you change game rules, scoring constants, storage keys or the data contract, update the matching doc in the same change.

## Known state

- The weapon sync script is written but has not been run yet, so `weapons.json` is still placeholder. The alluvium sync script is written but has not been run yet, so `alluviums.json` is still placeholder (stats are real); slot-2 pools will be entered by the user.
- The repo name is assumed to be `zeroth` (affects the default Vite base path).
- The app has not been built or tested by the agent (the user's rule: build and test only when asked explicitly).
