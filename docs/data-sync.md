# Data sync (weapons)

`npm run sync:weapons` (`scripts/sync-weapons.ts`) pulls every weapon from the Endfield Talos Wiki (https://endfield.wiki.gg) and writes `src/data/weapons.json` together with its source trail. The source-tracking approach is modelled on the reference project `FlamingFox911/endfield-dijiang-optimizer` (its `catalogs/<date>-<ver>/` bundles).

**Generated files: do not edit by hand. Re-run the script instead.**

| File | Contents |
| --- | --- |
| `src/data/weapons.json` | Weapons: `id`, `internalName`, `rarity`, `type`, `essence`, `icon`, `sourceRefs` |
| `public/weapons/<id>.png` | Weapon icons (see "Weapon icons") |
| `src/data/sources.json` | `{ sources: [...] }` index of every source used (one per wiki page plus the category listing) |
| `src/data/gaps.json` | `{ gaps: [...] }` weapons that could not be parsed (excluded from `weapons.json`) |
| `src/data/manifest.json` | `catalogId`, `snapshotDate`, optional `gameVersion`, `source`, `files`, `counts`, `contentHash`, `notes` |
| `src/locales/en.json` | Only the `weapons` map (id to wiki page title) is replaced; other keys are untouched |

There is a single current bundle (no dated snapshot folders); git history holds older snapshots.

## Running it

```
npm run sync:weapons                       # write the files
npm run sync:weapons -- --dry-run          # parse and report, write nothing
npm run sync:weapons -- --no-images       # skip the weapon icon download
npm run sync:weapons -- --force            # allow replacing even if known weapons would disappear
npm run sync:weapons -- --game-version 1.6 # record the game version in the manifest
```

(The agent must not run this unless the user asks; it makes network requests and rewrites data files.)

## How the wiki is read

- The list page `https://endfield.wiki.gg/wiki/Weapon` has no data table (only a navbox), so the script uses the **MediaWiki API** (`/api.php`): `list=categorymembers` for `Category:Weapons` (namespace 0), then `prop=revisions` wikitext in batches of 20.
- The wiki returns **403** to browser-like clients but accepts a **descriptive User-Agent**. The script sends a generic one (override with the `SYNC_USER_AGENT` env var; never put personal details in it).
- Volume is small (about 6 API requests, plus 1 request per weapon icon on the first run), with a 500 ms pause between requests and 3 retries with backoff on 429/5xx. `robots.txt` allows crawling (Content-Signal `ai-train=no`; this is personal tooling, not AI training). Keep it low-volume.
- `Category:Weapons` also contains the list page `Weapon` itself; it has no infobox, so it is skipped (not a gap).

## What is parsed

Each weapon page has two templates:

```
{{Weapon infobox |name= |rarity=6 |filename=wpn_lance_0012 |type=Polearm ...}}
{{Weapon skill|Polearm|Agility [L]|Physical DMG [L]|Efficacy: Weight of Mountain}}
```

- The three skills are the weapon's **essence stats**: slot 1 main attribute, slot 2 sub stat, slot 3 skill stat.
- Normalisation (`scripts/lib/weapon-wikitext.ts`): strip the magnitude tag `[L]`/`[M]`/`[S]`; for the third skill keep only the part before `:` (`Efficacy: Weight of Mountain` is stat `efficacy`).
- Names map to stat ids through `src/locales/en.json` (`stats`) plus `src/data/stats.json`, so the lookup stays in sync with the stat list. The slot comes from which list the stat is in.
- **3-star weapons have only two skills (no slot 2)**: `essence.slot2` is omitted. Slot 1 and slot 3 are required.
- Weapon id = snake_case of the page title (`Mountain Bearer` is `mountain_bearer`, `Pathfinder's Beacon` is `pathfinders_beacon`, `Opus: The Living` is `opus_the_living`). The wiki internal name (`wpn_lance_0012`) is kept as `internalName`. Weapon `type` is a snake_case id (`sword`, `great_sword`, `polearm`, `handcannon`, `arts_unit`).

## Weapon icons

- The infobox `images` field lists files as `File name.png:Label;` entries (`Icon`, `Full`, `Max`). Only the **`Icon`** image (~250px, ~40 KB) is downloaded.
- Flow: `prop=imageinfo` (`url|sha1|mime`) in batches of 50, then one download per new or changed icon (500 ms apart, same User-Agent and retries). The response must be a PNG (checked by its signature). The wiki's `sha1` is **not** compared with the downloaded bytes (the CDN can re-encode images, so they differ); it is only used to detect that the wiki file changed.
- Saved as **`public/weapons/<id>.png`** (committed; served at `<base>/weapons/<id>.png`). `weapons.json` records `icon: { file, sha1 }`; the path is derived from the id.
- Re-runs skip icons whose file exists and whose sha1 is unchanged. `icon.sha1` is part of `contentHash`.
- Each icon also gets a `sourceRefs` entry (`wiki-gg-icon-<id>`, link to the wiki `File:` page, `community`) and an entry in `sources.json`.
- A missing or failed icon is a warning, not a gap: the weapon is kept (without `icon`, or with its previously recorded icon if that file still exists).
- `--no-images` skips the image phase and keeps the recorded icons. `--dry-run` reports how many icons would be downloaded and writes nothing.
- Images are community-authored wiki.gg content; keep the source links.

## Source tracking (same ideas as the reference project)

- Every weapon has `sourceRefs: [{ id, label, url, retrievedOn, confidence, revisionId }]` pointing at its wiki page and the exact **wiki revision id** used. `sources.json` is the top-level index of the same entries.
- `confidence` values: `official`, `community`, `guide_site`, `manual_override`. Endfield Talos Wiki data is `community`. Use `manual_override` only for a value the user decided by hand.
- `gaps.json` lists anything missing or unparseable (unknown stat name, no skill template, invalid rarity, empty id): `{ subject, field, problem, sourceId }`. A gapped weapon is excluded from `weapons.json` rather than guessed.
- `manifest.json.contentHash` is a sha256 of the content **ignoring `retrievedOn`**, so a re-run on a later day with no wiki changes writes nothing. `retrievedOn` is also kept for a page whose revision id is unchanged.
- **Never replace data with worse data:** if a previously known weapon (placeholder `sample_*` ids are ignored) would be missing or become a gap, the script aborts without writing unless `--force` is given.
- If two titles produce the same id, the script aborts.

## When the wiki or the stat list changes

- New unknown stat name: it appears as a gap. Add the stat to `src/data/stats.json` and its name to `src/locales/en.json`, update the docs, then re-run. Do not map unknown names by guessing; ask the user.
- Locale: weapon display names are the wiki page titles.
- Attribution: wiki.gg content is community-authored; `sources.json` links each weapon to its page. Keep the links and `confidence` intact.

## Tests

`scripts/__tests__/weapon-wikitext.spec.ts` covers template parsing, skill-name normalisation, id generation, 3-star weapons and gap reporting using inline wikitext fixtures (no network).

# Data sync (Energy Alluviums)

`npm run sync:alluviums` (`scripts/sync-alluviums.ts`) reads the Energy Alluvium page of the Endfield Talos Wiki (https://endfield.wiki.gg/wiki/Energy_Alluvium) through the MediaWiki API (one request, same generic User-Agent and retries as the weapon sync) and **adds** the locations it lists to `src/data/alluviums.json`.

**`alluviums.json` is owned by the user.** The wiki has no slot-2 data, so the user enters each `slot2Pool` (8 stats) by hand. The sync is therefore add-only:

- A location not yet in the file is appended as `{ id, slot2Pool: [], slot3Pool: [8 stats from the wiki], sourceRefs }` and its name is added to the locale `alluviums` map.
- A location already in the file is **never modified** (name, pools and sources stay as they are). If the wiki's slot-3 pool differs, the script only prints a note.
- `sample_alluvium_*` placeholders are **not** removed by the script; delete them by hand.
- Existing locale names are kept; only names for new ids are added.
- Aborts without writing if no location parses or two titles produce the same id.

```
npm run sync:alluviums                # add new locations
npm run sync:alluviums -- --dry-run   # show what would be added, write nothing
```

(The agent must not run this unless the user asks; it makes a network request and rewrites data files.)

## How the page is read

- Wikitext tables per region; each row is `| [[Location]]`, an enemies cell, and an essences cell of `{{I|Flawless Essence: Skill}}` items. The skill names are the location's slot-3 stats; the plain `{{I|Flawless Essence}}` item has no stat and is ignored (`scripts/lib/alluvium-wikitext.ts`).
- Names map to stat ids through `src/locales/en.json` (`stats`) plus `src/data/stats.json`, and must be slot-3 stats.
- Id = snake_case of the page title (`The Hub` is `the_hub`, `Si's Painting` is `sis_painting`). Display name = the page title.
- A row whose pool is not exactly 8 distinct known slot-3 stats is reported as a gap in the console output and skipped (nothing is guessed). There is no gaps/manifest file for alluviums, because the data file is hand-maintained.
- New entries get one `sourceRefs` entry (`wiki-gg-energy-alluvium`, wiki `revisionId`, `confidence: community`).

## After a sync

New entries have an empty `slot2Pool`, so the app's data validation reports "slot2Pool has 0 entries, expected 8" until the user fills it. This is intended: it flags what still needs entering.

## Entering slot 2 pools

`npm run edit:alluviums` (`scripts/edit-alluviums.ts`) is an interactive terminal tool for filling `slot2Pool`:

It is a keyboard-driven menu (like the Vue CLI prompts):

1. A list of every alluvium with its progress (`0/8` or `done`), incomplete first. Up/Down move, Enter selects, `q`/Esc quits.
2. A checklist of the 12 slot-2 stats (`stats.json` `slot2`), with the alluvium's slot 3 pool shown for reference. Up/Down move, **Space** toggles a stat, Enter on an action row runs it.
3. Action rows: **Copy pool from another alluvium...** (pick a complete one as a starting point), **Save** (requires exactly 8 selected, otherwise a warning is shown), **Back (discard changes)**. Esc also goes back without saving.

It changes only the chosen entry's `slot2Pool` (ids in `stats.json` order) and preserves every other field and entry. It needs a real terminal (it exits if stdin is not a TTY). The agent must not run it. The raw-mode key handling lives in `scripts/lib/terminal-menu.ts`; `scripts/lib/slot2-input.ts` keeps `POOL_SIZE` and `poolStatus`.

## Tests

`scripts/__tests__/slot2-input.spec.ts` covers `poolStatus`. `scripts/__tests__/alluvium-wikitext.spec.ts` covers link targets, skill extraction, id generation and gap reporting using inline wikitext fixtures (no network).