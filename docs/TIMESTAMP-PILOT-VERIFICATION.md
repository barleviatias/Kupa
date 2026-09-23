# Timestamp pilot verification — 2026-09-23

Historical verification record. The local pilot mode and preparation command
were removed after rollout; this document is not a current setup guide.

## Data review

Read-only Atlas checks compared three distributed subtitle phrases (at least
five Hebrew words each) against each existing episode transcript, with bounded
24-character gaps between words. Seventy-nine episodes matched at least two
samples; this supports identity but is not complete text or timing alignment.
Evidence is recorded in `migration/transcript-evidence.json`.

S04E11 matched none. An additional MongoDB aggregation grouped records by their
entire `script` value and confirmed that S04E10 and S04E11 have identical scripts.
S04E11 is marked `needs_review` and excluded from proposed updates. Its Netflix
subtitle file has not been substituted for the production transcript.

Current dry run: 101 source episodes, 69,097 cues, 79 proposed updates,
one blocked mapping, one approved YouTube correction, and 21 deferred sources
(season 5 and the making-of special). The nonzero dry-run exit is expected while
the mapping conflict remains. No database writes or production search requests
were made during this verification.

## Local application checks

- 17 Node regression tests pass, including real S03E06 fixture phrases.
- Lint passes with the existing analytics `<img>` warning.
- Production build passes with network access for the existing Google font.
- Browser checks at desktop size and 390 × 844 verify RTL layout, match actions,
  expanded matches, input errors and a distinct no-results state. A mobile player
  overflow was corrected; document width equals viewport width at 390 pixels.
- Searching `מה אני הכי שונאת בשירה` returns S03E06 at 6,160 ms, displayed as
  `0:06`. The player button produces `start=4`, allowing two seconds of context.
- Searching `שירה` returns four complete-word matches. Expanded match `19:59`
  produces `start=1197`.
- The embedded YouTube player reports “This video is unavailable” in the local
  browser. The fallback direct link `https://www.youtube.com/watch?v=3_p3Q293u44&t=4s`
  opens the correct episode and the player was observed playing at `0:04 / 26:44`.
  Embedding is not verified as working; no specific cause has been established.

The local fixture reuses previously recorded zero-offset checkpoints near
78.423, 752.833 and 1480.133 seconds. Unit checks verify phrase-to-cue lookup near
those positions; they do not constitute fresh audiovisual synchronization
verification at all three points. Production import payloads retain unverified
playback status. Pilot mode only operates in development and never accesses MongoDB.

## Remaining before rollout

Resolve S04E11 identity separately, validate source conversion and complete BSON
sizes, prepare and restore-test a database backup, implement conditional apply
and rollback, and verify alignment for each enabled episode. The normal feature
requires both the server flag and explicit episode allowlist and defaults off.

Dependency installation reported 21 advisories (4 moderate, 15 high, 2 critical)
in the existing locked dependency tree. Versions were not changed in this work;
review these before production deployment as a separate dependency update.

## Embedded playback follow-up

The IFrame API exposed error 150 on `http://127.0.0.1:3000`. The same video
successfully plays inside the app on `http://localhost:3000`. This establishes
an origin-specific difference in this local browser; it does not imply that the
video is globally disabled for embedding. The development home page now redirects
the numeric loopback host to localhost; production hosts are unaffected.
Timestamp buttons now seek/play through the IFrame API without recreating the
player. The real page origin and explicit referrer policy are supplied.
This supersedes the initial embedded-playback failure recorded above.
