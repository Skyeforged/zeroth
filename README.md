# Endfield Essence Tools

Frontend-only Vue 3 app for Arknights: Endfield: an **Essence Tracker** and an **Essence Farming Optimizer**. Static SPA (hash routing), deployable to GitHub Pages.

## Data

Game data lives in `src/data/*.json` and contains only unique snake_case ids. Display names live in `src/locales/en.json`.
The bundled data is **placeholder sample data** (`sample_*`); replace `stats.json`, `weapons.json`, `alluviums.json` and the locale file with real data. Data is validated on startup and problems are shown at the top of the page.

## Scripts

- `npm run dev` - dev server
- `npm run build` - type-check and build to `dist/`
- `npm run test:unit` - unit tests

## GitHub Pages

Set Settings → Pages → Source to **GitHub Actions**. `.github/workflows/deploy.yml` builds on push to `main` with `VITE_BASE=/<repo-name>/`. For local builds the base defaults to `/zeroth/` (override with `VITE_BASE`).
