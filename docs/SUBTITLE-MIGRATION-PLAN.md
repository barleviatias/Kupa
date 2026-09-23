# Production subtitle and timestamp migration

Historical plan for the completed initial migration. The one-time migration
and local pilot commands were removed; use the
[episode import runbook](EPISODE-IMPORT-RUNBOOK.md) for future episodes.

Status: isolated `kupa_prod` migration completed, 2026-09-23. The source `test`
database was not modified. See [migration results](KUPA-PROD-MIGRATION-RESULT.md)
for the executed scope and verification; the rollout design below includes
remaining work. The Vercel deployment has not been changed.

Implemented locally: explicit mapping, dry-run payloads, bounded timestamp search,
shared connection pool, per-match playback actions and an offline S03E06 pilot.
Transcript sampling found 79 episodes with at least two of three matching cue
phrases. S04E11 has the exact same production script as S04E10, confirmed by
MongoDB grouping on the full script. It is now quarantined (`needs_review`).
The current dry run proposes 79 updates and reports one blocking conflict.
See `migration/transcript-evidence.json`; sampling is not complete alignment.
Production apply, backup/restore automation and timing verification remain pending.

## Evidence and scope

- Connected Atlas project: `kupaDB`, cluster: `AtlasCluster`.
- Inspected `test.kupa`: 80 episodes, 20 each in seasons 1–4. All have string transcripts; none has a `subtitles` field.
- Existing indexes: `_id_` and `script_text`. The current regex search does not automatically benefit from the text index.
- Local source: `/Users/barleviatias/Documents/Kupa-subtitles`, containing 101 Netflix episodes and 69,097 timed Hebrew cues. Seasons 2–5 have 20 episodes each; season 1 has 20 regular episodes plus a making-of special.
- Only Netflix S03E06 has YouTube timing spot checks: video `3_p3Q293u44`, offset 0, at approximately 78.423, 752.833 and 1480.133 seconds. These are three checkpoints, not exhaustive synchronization validation.
- The running production deployment's connection target still needs verification. Both current API routes hardcode database `test`; its name is not evidence that it is a development database.

Target: preserve existing episode IDs, transcripts and links; add timed search to the existing 80 episodes; then publish the 20 season-5 episodes when their playback links are ready. Keep the making-of special out of normal search until its placement is decided.

## 1. Resolve episode identity before importing

Never join solely on season and episode number: Netflix season 1 uses a different order.

| Existing Kupa episode (season 1) | Netflix episode |
| --- | --- |
| 1 | 1 |
| 2 | 2 |
| 3 — ראמזי מאוהב | 17 |
| 4 — בוקר של פיגוע | 3 |
| 5 | 4 |
| 6 | 7 |
| 7 | 5 |
| 8 | 6 |
| 9 | 8 |
| 10 | 9 |
| 11 | 10 |
| 12 | 11 |
| 13 | 12 |
| 14 | 13 |
| 15 | 14 |
| 16 | 15 |
| 17 | 16 |
| 18–20 | 18–20 |

This is a title-based candidate mapping. Confirm it with transcript samples before applying. Seasons 2–4 appear to retain episode order, with title punctuation differences; validate those too.

Create a versioned mapping file with existing `_id`, canonical season/episode, Netflix ID and numbering, source file/hash, YouTube video ID, and verification status. Preserve production numbering and `_id` values. Quarantine ambiguous mappings instead of guessing.

Production was observed assigning `KK4zLYp_O6E` to both S02E09 (המרצדס) and S04E06 (אבא של נעמי). The user confirmed the correction on 2026-09-23:

- S02E09: https://www.youtube.com/watch?v=X_EbFZ_UZBc (replace the existing link during migration).
- S04E06: https://www.youtube.com/watch?v=KK4zLYp_O6E (existing link is correct).

This correction is recorded in the plan; it has not yet been applied to production. Episode link identity is user-confirmed; subtitle-to-video timing still needs verification for both episodes. Season 5 requires a verified canonical episode list and YouTube links.

## 2. Add data without replacing the existing transcript

Embed cues in each episode document. Validate final BSON sizes against MongoDB's document limit before choosing this layout definitively. Proposed additions:

```js
{
  subtitleSchemaVersion: 1,
  subtitles: {
    source: "netflix",
    netflixId: "...",
    sourceSeason: 3,
    sourceEpisode: 6,
    language: "he",
    sourceHash: "...",
    importVersion: "...",
    importedAt: ISODate("..."),
    cues: [{ id: 0, startMs: 6160, endMs: 8200, text: "..." }],
    search: {
      normalizationVersion: 1,
      text: "...",
      spans: [{ start: 0, end: 12, cueId: 0 }]
    }
  },
  youtubeTiming: {
    videoId: "...",
    sourceHash: "...",
    status: "unverified", // verified | needs_review
    offsetMs: null,
    checkedAt: null,
    checkpoints: []
  }
}
```

Cue times remain in the original Netflix timeline. Search spans use half-open JavaScript string offsets into the normalized subtitle text, built together with normalization. Do not apply old transcript character offsets to the new cues. Preserve the existing `script` field as a compatibility and rollback path.

Playback alignment is separate: `youtubeMs = subtitleMs + offsetMs`. Unknown offset is `null`, never an assumed zero. Verification is tied to both video ID and subtitle hash; changing either invalidates it. Check beginning, middle and end, aiming for at most one second of error. If edits or drift prevent a constant offset, leave jumps disabled pending a segment-based alignment design.

## 3. Implement bounded search and match timestamps

Prepare the backend before enabling the feature:

1. Validate and limit query length before connecting or logging; reject queries that normalize to empty text. Use shared, cached MongoDB connections in both API routes and remove per-request shared disconnection.
2. Build one Hebrew normalization function for query and subtitle text, handling niqqud, punctuation and whitespace while retaining cue spans. Start with consecutive normalized phrase tokens, including phrases split across adjacent cues. Bound query size, results, matches per episode, query time and cross-cue time gaps. Compare recall with existing examples before deciding whether bounded loose matching is needed.
3. Retain legacy search while the feature is disabled. When enabled, search subtitle text for migrated episodes; use legacy transcript search for unmigrated episodes. Avoid duplicate results. Legacy matches without reliable cue correspondence have no timestamp.
4. Return an additive `matches` array. Retain `context` strings during frontend transition. Each timed match contains excerpt text, matched cue IDs, `sourceStartMs`, `sourceEndMs`, and nullable `playbackStartMs`. Return playable timestamps only for verified alignment. Do not return the full cue array.
5. Preserve `_id` and `matches` through `app/page.js` conversion. URL-encode queries, handle failed requests, always clear loading, and prevent older responses from replacing newer results.
6. Add a timestamp action to every playable match, including expanded matches, with Hebrew/RTL presentation. Seek two seconds before the match, clamped to zero. Display the actual match time; compute playback start in whole seconds. Use validated video IDs and an embed `start` parameter initially; handle repeated clicks with a player reload key. Do not promise automatic playback.

If a quote occurs several times, return distinct occurrences and timestamps. Build excerpts from cue text, with highlighting mapped from normalization, rather than highlighting with an unescaped user regex.

Proposed server configuration during implementation: `MONGO_DB_NAME` (default `test` for compatibility), `TIMESTAMP_SEARCH_ENABLED` (default false), plus a pilot episode allowlist. Document exact implemented variables in `.env.example` and README; preserve local credentials.

YouTube documents embed start times in seconds, and seeking may land near a keyframe: [official player parameters](https://developers.google.com/youtube/player_parameters#start).

## 4. Dry run and staging

Build an importer with dry-run as the default and an explicit apply mode. It must:

- Validate source hashes, Hebrew text, finite nonnegative starts, positive durations, ordered starts and counts; allow legitimate overlapping cues.
- Require the explicit episode mapping; detect missing IDs, duplicate assignments and reused playback links.
- Report intended updates, inserts, unchanged records and conflicts, including final BSON sizes.
- Be idempotent using source hash and schema/normalization versions. Resume interrupted runs without duplicates.
- Update existing records by exact `_id` and expected pre-import state, with upsert disabled. Record conflicts rather than overwriting concurrent changes.
- Keep a migration ledger and before-images, including whether each changed field originally existed. Keep new season-5 IDs separately for rollback.
- Avoid changing `log`, existing transcripts, indexes or playback links as an incidental import action.

Use a designated staging database and fixture search logs. Initial expected inventory: 80 existing episode mappings, 20 proposed season-5 additions, one excluded special. Mapping or link conflicts must be resolved or explicitly excluded from the enabled rollout.

Verify Hebrew phrases, punctuation/niqqud, cross-cue phrases, repeated quotes, empty/missing/non-Hebrew input, no matches, database errors, concurrent search/counter requests, unknown alignment and negative adjusted start times. Exercise retry, partial import recovery and rollback. Run lint/build and inspect mobile/desktop RTL playback behavior.

## 5. Production rollout

1. Verify the deployed database/collection and app version. Back up the affected documents and index definitions; prove restoration in staging. Review the dry-run mapping, counts and conflicts before an explicit production apply.
2. Deploy the additive backend/frontend with timestamps disabled. Verify ordinary search and counter behavior.
3. Import approved subtitles into existing episodes in small, resumable batches. Read back hashes, cue counts and identity fields after each batch.
4. Enable S03E06 as the first pilot after reconfirming its mapping and playback checkpoints. Test known quotes from beginning, middle and end against the deployed UI.
5. Enable additional episodes as their YouTube alignment passes. Monitor search errors, latency, no-match rate and playback correctness. Log counts/status rather than whole transcripts.
6. Add season 5 after its identity and playback checks pass, generating its legacy `script` from cue text for compatibility. Update the UI's seasons 1–4 copy when season 5 actually becomes searchable.

MongoDB updates are atomic per document, not across an entire batch. The importer must record and recover partial success: [official atomicity documentation](https://www.mongodb.com/docs/manual/core/write-operations-atomicity/).

## Rollback and completion

Immediate rollback: disable the feature to restore legacy search. For a data rollback, restore only fields changed by this migration from before-images; remove fields that were previously absent. Remove newly inserted season-5 records only if they still match the migration version and have no intervening edits. Preserve search logs and unrelated changes. Conflicting records require review.

Complete when all intended episodes have confirmed identity, imported counts/hashes match source, verified matches open the correct video near the quote, unverified matches never expose a misleading jump, staging checks pass, and production rollback has a tested procedure. Subtitle import completion and YouTube alignment completion are separate milestones.

## Netflix timing approval — 2026-09-23

The user explicitly approved trusting Netflix times without checking YouTube
alignment. Playback jumps are now enabled for all 99 imported subtitle episodes:
98 use `youtubeTiming.status=assumed_netflix_zero` and `offsetMs=0`; S03E06 keeps
its existing verified status. This supersedes the alignment gate described above.
Source-hash and video-ID checks remain active. Buttons seek two seconds before
the Netflix cue, clamped to zero. S04E11 still has no imported subtitles because
its episode identity issue is separate from timing. No source `test` records or
search logs were changed by enabling timing.
