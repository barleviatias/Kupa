# Adding episodes to Kupa

This is the record of how season 5 was added on 2026-09-23 and the checklist to
use when season 6 episodes become available. It is not an automatic import: no
season-6 source, mapping, or importer exists in this repository yet.

## What we did for season 5

1. Prepared Hebrew subtitle sources in the separate `Kupa-subtitles` directory.
   Its `manifest.json` listed source identities, XML paths, SHA-256 hashes, cue
   counts and titles. The import code verified source hashes and cue structure.
   We archived all 101 available source records in
   `kupa_prod.subtitle_sources`; archive entries alone are not searchable.
2. Matched the 20 regular season-5 episodes by episode number and title to the
   [official KAN 11 playlist](SEASON5-YOUTUBE-LINKS.md), excluding extras. The
   reviewed IDs, Netflix source IDs/hashes and YouTube links are in
   `migration/season5-episode-map.json`.
3. Used the now-removed `scripts/import-season5.mjs` without arguments for a
   dry run, then with `--apply` for the reviewed insert. It checked the archived source identity,
   unique episode numbers, collisions with existing episode IDs, numbers,
   videos and sources, and the 16 MiB BSON limit before writing to
   `kupa_prod.kupa`. It generated a legacy `script` from the cues as well as
   normalized timed-search fields, then read every inserted document back. The
   ignored report is
   `.migration-output/season5-import-report.json`.
4. Verified 20 inserts, 12,049 cues, and 100 regular episodes in the catalog.
   `log` was unchanged by the import. A browser search for
   `ואני מאחלת לעצמי השנה` found S05E01 and its matching video. See the
   [migration result](KUPA-PROD-MIGRATION-RESULT.md) for the recorded outcome.
5. Timing was initially unverified. A later explicit approval enabled
   `assumed_netflix_zero` for the imported episodes; that decision was specific
   to those sources and must not be applied automatically to a future season.

Those one-time scripts were removed after completion. The season-5 importer
hard-coded exactly 20 mapping entries, while the original database migration
expected the initial 101-source inventory. Neither approach is a season-6
importer. Reusable source validation and subtitle-field construction now live
in `lib/subtitle-import.mjs`.

## When a season-6 episode is ready

1. Establish the canonical episode number and Hebrew title from an official
   source. Confirm the video is the same episode and playable in the app.
   Record its URL/video ID and exclude trailers, clips, bloopers and specials
   unless they receive an explicit catalog placement. Do not assume release
   order matches Netflix numbering.
2. Obtain a lawful Hebrew transcript or subtitle source. Record provenance,
   source episode ID, source file and SHA-256 hash. Validate nonempty Hebrew
   cues, chronological times, cue count and source hash. If only a video is
   available, wait for text rather than publish an unsearchable episode.
3. Create a new, reviewed season-6 mapping. Preserve unique `_id`, season,
   episode, title, source identity/hash and YouTube link. Build an incremental
   importer that accepts one or more reviewed
   episodes instead of requiring a complete 20-episode season. It should
   archive the new source under `subtitle_sources`, default to a dry run,
   require an explicit apply, reject duplicates within the proposed batch and
   collisions with existing IDs, numbers, videos and sources, check BSON size,
   and read back each insert. Make reruns safe after partial success; never
   overwrite an existing episode implicitly.
4. Check the projected `kupa` count. `lib/search-service.mjs` currently scans
   at most 150 episodes and fails explicitly above that bound. If the new
   catalog would exceed it, change and test the search bound before import.
   Run `bun run test:migration`, `bun run test:search`, `bun run lint` and
   `bun run build` for importer/search changes. Use fixtures or a designated
   development database for tests; `test` remains read-only.
5. Review the dry-run report and a private pre-import catalog snapshot and
   rollback plan, then apply only to `kupa_prod`. Verify inserted IDs, episode
   count, source/cue hashes, log count and representative Hebrew searches. Do not
   change existing episodes or logs as a side effect. Record the exact
   commands, counts, hashes, links, date and any exclusions in a new dated
   result note, without committing full subtitle text or credentials.
6. Keep `youtubeTiming` unverified until the new episode's subtitle-to-video
   offset is checked or explicitly approved. If timed search is enabled,
   review `TIMESTAMP_EPISODE_IDS` and include new IDs only when intended.
   Update the homepage season-range copy when season 6 is actually searchable.
   Refresh `/api/cron/warm-searches` with the configured `CRON_SECRET` after
   publishing so popular queries can include new episodes promptly; the
   five-minute in-process cache still needs time to expire. Verify a normal
   search and player on desktop and mobile before deployment.

Search requests write to `log`; verification against a populated destination
will add normal search events. Read-only collection checks do not. Never write
to the legacy `test` database.
