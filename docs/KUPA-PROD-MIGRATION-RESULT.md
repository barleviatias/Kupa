# kupa_prod migration result — 2026-09-23

The user-authorized destination `kupa_prod` has been created on the configured
Atlas cluster. The application on localhost now uses it with pilot mode disabled.
The existing Vercel deployment has not been reconfigured or redeployed.

| Collection | Verified state |
| --- | --- |
| `kupa_prod.kupa` | 80 original episodes, with all original IDs and scripts retained |
| `kupa_prod.kupa` subtitle fields | Added to 79 checked episodes |
| `kupa_prod.log` | All 10,956 historical records copied, preserving IDs and timestamps |
| `kupa_prod.subtitle_sources` | All 101 extracted source records, containing 69,097 cues |

S02E09's YouTube link is corrected in the destination only. S04E11 remains an
unaltered copy of its original episode pending review of the duplicated S04E10
transcript. The archive includes all 20 season-5 sources and the making-of
special, but these are not yet published in the app's episode collection.

The importer created a private, Git-ignored Extended JSON backup of original
episodes, logs and index definitions, verified its round-trip, checked every
copied document, recreated the `script_text` index, and verified all final
episode documents. Largest resulting episode: 173,439 BSON bytes. Backup path
and SHA-256 are recorded in `.migration-output/kupa-prod-migration-report.json`.

Source protection verified: `test` still has 10,956 logs, zero subtitle schema
fields, and its entire episode snapshot compares unchanged. All migration write
targets were `kupa_prod`.

## Application verification

- 23 regression tests pass, including six legacy search comparisons.
- Lint and production build pass (existing analytics image lint warning remains).
- The database-backed browser displayed the original count of 10,956 searches.
- Searching `טוב שוער` returned the expected eight episode IDs; S01E17 showed
  two occurrences, matching the live-site example.
- That verification search created one normal new destination log. Final count:
  `kupa_prod.log` = 10,957, while `test.log` remains 10,956.
- Hebrew prefix/suffix matching is restored, including `שוער` matching `שוערת`.
  Common-query episode results are no longer capped at 50.
- S03E06 alone has verified YouTube timing. Other imported episodes are searchable
  with cue data, but jump actions remain hidden until their alignment is checked.

Next work: verify remaining playback alignments, resolve S04E11, map season-5
YouTube links and publish those episodes, and decide placement of the special.
Before switching Vercel, copy any additional `test.log` records with the
append-only `--sync-logs --apply` command documented in README. Do a final catch-up
after the old deployment stops receiving traffic so cutover searches are retained.

## Season-5 follow-up

The supplied official playlist matched all 20 season-5 episode numbers and
titles. They are now in `kupa_prod.kupa` with links and 12,049 cues, bringing the
catalog to 100 episodes (99 with subtitles). The import preserved the search log
count. See [season-5 mapping and verification](SEASON5-YOUTUBE-LINKS.md).
Playback timing for these 20 episodes still requires alignment checks.

## Netflix timing approval — 2026-09-23

The user explicitly approved trusting Netflix times without checking YouTube
alignment. Playback jumps are now enabled for all 99 imported subtitle episodes:
98 use `youtubeTiming.status=assumed_netflix_zero` and `offsetMs=0`; S03E06 keeps
its existing verified status. This supersedes the alignment gate described above.
Source-hash and video-ID checks remain active. Buttons seek two seconds before
the Netflix cue, clamped to zero. S04E11 still has no imported subtitles because
its episode identity issue is separate from timing. No source `test` records or
search logs were changed by enabling timing.
