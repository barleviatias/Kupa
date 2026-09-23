# Working on Kupa

## Project and structure

Kupa is a Hebrew, right-to-left quote search app for Kupa Rashit, using Next.js
16 App Router, React 19, JavaScript, Tailwind CSS, and MongoDB through the MongoDB driver.
The `@/` alias points to the repository root.

- `app/page.js`: search form, client requests, and results state.
- `app/components/resultsList.jsx`: episode cards, YouTube embeds, and excerpts.
- `app/api/search/route.js`: Hebrew phrase matching and search logging.
- `app/api/counter/route.js`: count of logged searches.
- `app/api/top-searches/route.js`: all-time popular-search rankings.
- `app/api/cron/warm-searches/route.js`: weekly MongoDB result-cache refresh.
- `proxy.js`: development-only localhost redirect for YouTube embeds.
- `app/layout.js`, `app/globals.css`, `tailwind.config.js`: layout and styling.

## Setup and commands

- Use Bun 1.x and the committed `bun.lock`; install with `bun install --frozen-lockfile`.
- Copy `.env.example` to `.env` only if no local environment file exists.
- Database API routes require server-only `MONGO_URI`; `MONGO_DB_NAME` defaults to `kupa_prod`.
  They share the cached driver pool in `lib/mongodb.mjs`.
- Collections: `kupa` for episodes, `log` for search events, `search_cache` for weekly popular results,
  and `subtitle_sources` for archived subtitle material. No general seed script exists.
- `bun run dev`: development server with Webpack and hot reload. Keep it running during ordinary edits;
  a framework/dependency upgrade may require one restart. `bun run lint`: ESLint checks.
- `bun run build`: production build with Turbopack. `bun run start`: serve that build.
- `bun run test:migration`: reusable subtitle-import validation tests.
- The completed one-time database migration, season-5 import, and local pilot
  scripts were removed. Build a new incremental importer for future episodes.
- Building uses `next/font/google` and may require network access.
- Bun with Next.js 16 cannot currently resolve the externalized MongoDB module in Turbopack dev;
  keep the `--webpack` dev flag until that combination is verified to work. Production Turbopack
  build and database routes were checked with Bun.

## Conventions

- Keep changes focused and follow surrounding JavaScript style. Avoid incidental
  framework, language, or dependency migrations.
- Preserve Hebrew copy and RTL layout; check mobile and desktop for UI changes.
- Never commit credentials, print secrets, or expose them in client bundles.
  Preserve existing local environment files. Document new variables in both
  `.env.example` and README.
- Validate search input before database work. Reject queries that normalize to
  empty text, bound work, and ensure matching loops always terminate.
- Reuse database connections safely; do not disconnect a shared connection while
  another request may be using it.
- Handle failed requests and loading cleanup. Distinguish errors from no matches.
- Use fixtures or a designated development database for verification. Search
  requests write to `log`; do not assume access to populated or production data.

## Verification

For application changes, run lint and build when dependencies and network are
available. `bun run test:search` and `bun run test:migration` provide regression tests. Add targeted regression
coverage for behavioral fixes, particularly search normalization and termination.
For search changes, cover valid Hebrew, missing/empty/non-Hebrew queries, no
matches, database failure, and concurrent requests as appropriate.
For documentation and environment-template changes, verify variable names against
source, Git ignore rules, and the diff. Report checks actually performed and any
blocked checks; do not claim database connectivity without verifying it.

- Preserve `test` as a read-only migration source. App and migration writes target `kupa_prod`.

## Adding episodes

Read [the episode import runbook](docs/EPISODE-IMPORT-RUNBOOK.md) before adding a season or episode.
It records the season-5 import and the steps to adapt for season 6. In particular:

- `migration/season5-episode-map.json` and the migration notes are historical
  evidence. The one-time import scripts are gone; do not recreate or reuse their
  fixed season-5 assumptions for season 6. Reuse `lib/subtitle-import.mjs` for
  cue validation and subtitle-field construction.
- A new episode must have a reviewed season/episode/title identity, a playable matching video,
  and searchable transcript/subtitle text. Archive and hash source material; do not assume
  Netflix timing matches YouTube or carry the past season's timing approval forward.
- Use a dry run, collision and BSON-size checks, an explicit apply to `kupa_prod` only,
  read-back verification, and a private ignored report. Do not alter `test` or search logs.
- The search API fails when the catalog exceeds 150 episodes. Check projected size before
  publishing more episodes, and adjust/test that bound deliberately if needed.
- After an import, review `TIMESTAMP_EPISODE_IDS` and refresh the weekly popular-results
  cache so warmed searches include new episodes. The in-process search cache may take five
  minutes to expire. Update the UI's season range only after the new season is searchable.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
