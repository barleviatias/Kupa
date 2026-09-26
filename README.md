# Kupa

A Hebrew, right-to-left quote search app for Kupa Rashit. Search results show
matching episode excerpts and embedded YouTube videos. Built with Next.js 16,
React 19, Bun, Tailwind CSS and MongoDB.

## Run locally

1. Install Bun 1.x and run `bun install --frozen-lockfile`.
2. Copy `.env.example` to `.env` only if no local environment file exists, then
   set the server-only `MONGO_URI` for your database.
3. Run `bun run dev` and open [localhost:3000](http://localhost:3000).

| Variable | Purpose |
| --- | --- |
| `MONGO_URI` | Server-only MongoDB connection string; required by database routes |
| `MONGO_DB_NAME` | Database name; defaults to `kupa_prod` and overrides the URI database |
| `TIMESTAMP_SEARCH_ENABLED` | Approved timing is enabled by default; `false` disables it |
| `TIMESTAMP_EPISODE_IDS` | Optional pipe-separated episode restriction; absent uses approved database timing |
| `CRON_SECRET` | Server-only secret authenticating the weekly cache refresh |

Never commit credentials or put them in a `NEXT_PUBLIC_` variable. The example
URI requires a local MongoDB instance with episode data; this repo does not
start or seed one. Restart the dev server after changing environment variables.

The app uses `kupa` for episodes, `log` for search events, `search_cache` for
popular-query results and `subtitle_sources` for archived subtitle material.
The database account needs read access to `kupa` and read/write access to `log`
and `search_cache`. Episode imports also require write access to `kupa` and
`subtitle_sources`. The MongoDB driver pool is shared across requests.

## Commands

| Command | Purpose |
| --- | --- |
| `bun run dev` | Develop with hot reload (Webpack) |
| `bun run lint` | Run ESLint |
| `bun run build` | Create a production build (Turbopack) |
| `bun run start` | Serve that production build |
| `bun run test:search` | Search, ranking and cache regression tests |
| `bun run test:migration` | Reusable subtitle-import validation tests |

Development uses `.next-dev` and builds use `.next`, so a build does not replace
the running dev server's assets. The build uses `next/font/google` and may need
network access. Development uses Webpack because Bun and Next.js 16 Turbopack
currently fail to resolve the externalized MongoDB module together in dev;
production Turbopack builds and database routes have been verified with Bun.

## Search behavior

Queries must contain Hebrew and fit within 200 characters and 20 words. Search
scans at most 150 episodes, returns at most 150 episode cards and 30 matches per
episode, and fails explicitly if the catalog grows beyond its scan cap. Legacy
transcripts use bounded loose matching; timed subtitles use consecutive text,
including adjacent cues within the configured time gaps. The spellings
`פרנציפ` and `פרינציפ` share one canonical search and popular-search count.

The homepage displays the all-time top ten normalized searches from `log`.
Results are cached in each server process for five minutes. Every Monday at
03:00 UTC, a Vercel cron job computes those ten searches and stores results in
the shared MongoDB `search_cache` collection. Shared entries expire after eight
days; a miss or cache failure falls back to live search. Every request still
writes its own search event. Set `CRON_SECRET` in Vercel's production environment
before deploying so Vercel can authenticate `/api/cron/warm-searches`.
Independently, Vercel calls the read-only `/api/counter` route every Wednesday
at 04:00 UTC. This touches MongoDB even when nobody searches and keeps an Atlas
Free cluster active; it needs no secret because the counter route is already
public. Check the Cron Jobs page and function logs if the cluster stops receiving
traffic. The warmer still needs `CRON_SECRET` to run.

A timestamp jump appears only when the episode has an enabled subtitle record
and its `youtubeTiming` matches the subtitle hash and video ID. The historical
approval to use zero Netflix offset applied to the previously imported
99 episodes; it is not automatic for future episodes. Approved database timing
is used by default when timestamp variables are absent. Set
`TIMESTAMP_SEARCH_ENABLED=false` to disable it, or set the optional pipe-separated
`TIMESTAMP_EPISODE_IDS` to restrict episodes (an empty value disables all).
The local development
`proxy.js` redirects `127.0.0.1` to `localhost` because the numeric loopback
origin produced YouTube embed error 150. This redirect does not run in production.

## Adding episodes

Read the [episode import runbook](docs/EPISODE-IMPORT-RUNBOOK.md) before adding
season 6. The completed one-time migration and season-5 import scripts were
removed; there is no general episode importer yet. Reusable cue validation and
subtitle-field construction remain in `lib/subtitle-import.mjs`. Keep `test`
read-only and direct application/import writes to `kupa_prod`.

Historical records are preserved in the
[production migration result](docs/KUPA-PROD-MIGRATION-RESULT.md),
[season-5 mapping and verification](docs/SEASON5-YOUTUBE-LINKS.md) and
[subtitle migration plan](docs/SUBTITLE-MIGRATION-PLAN.md). The historical
[timestamp pilot report](docs/TIMESTAMP-PILOT-VERIFICATION.md) remains as
verification evidence; pilot commands and runtime mode are no longer present.
See [AGENTS.md](AGENTS.md) for contributor guidance.
