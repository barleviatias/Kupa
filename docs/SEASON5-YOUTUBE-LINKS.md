# Season 5 YouTube mapping

Matched by episode number and title against the [official KAN 11 playlist](https://www.youtube.com/playlist?list=PLLttfoK87AdW1TI5VZVTlGvQ4LpPAiP-n). Timing alignment is not yet verified.

| Episode | Title | YouTube |
| --- | --- | --- |
| 1 | כפרות | [Watch](https://www.youtube.com/watch?v=iL686rbf82M) |
| 2 | הסטארטאפ של כוכבה | [Watch](https://www.youtube.com/watch?v=UKww1xabTNQ) |
| 3 | שברת שילמת | [Watch](https://www.youtube.com/watch?v=ihH9gucGRS4) |
| 4 | דניס קמחי | [Watch](https://www.youtube.com/watch?v=OWUaTKTQ-bo) |
| 5 | טלפונובלה | [Watch](https://www.youtube.com/watch?v=hqyK0VQVsPQ) |
| 6 | גזענות קירחים | [Watch](https://www.youtube.com/watch?v=9m-aRG2DHYk) |
| 7 | אבא של כוכבה | [Watch](https://www.youtube.com/watch?v=KMR00mcwuHw) |
| 8 | התרומה | [Watch](https://www.youtube.com/watch?v=Pqp5r24VXHI) |
| 9 | לדפוק חתונה | [Watch](https://www.youtube.com/watch?v=YvxVA7sxdks) |
| 10 | הטיפ של ראמזי | [Watch](https://www.youtube.com/watch?v=Np6j5oLwLts) |
| 11 | הקללה של שירה | [Watch](https://www.youtube.com/watch?v=f_DGjoiaGVM) |
| 12 | אחות של כוכבה | [Watch](https://www.youtube.com/watch?v=3Pn6rOarD9w) |
| 13 | הו הא מי זה בא? | [Watch](https://www.youtube.com/watch?v=sV_prJK6TV4) |
| 14 | המזל של ניסים | [Watch](https://www.youtube.com/watch?v=woGDLM3Tdr0) |
| 15 | מסיבת סילבסטר | [Watch](https://www.youtube.com/watch?v=4eJGg635cGs) |
| 16 | נכנסת חסכת | [Watch](https://www.youtube.com/watch?v=BWZ9_y3ldK4) |
| 17 | אמנון והאונליין | [Watch](https://www.youtube.com/watch?v=dB9KFZWOmhw) |
| 18 | ריקוד האהבה | [Watch](https://www.youtube.com/watch?v=erfGJAvedjg) |
| 19 | אמנון ומאריסה | [Watch](https://www.youtube.com/watch?v=Ssy21RjZjyg) |
| 20 | שירה חודש תשע | [Watch](https://www.youtube.com/watch?v=FfaGNnDC3fY) |

Excluded: season-5 bloopers, Independence Day 2025 special, and the confessions special. They are not the 20 regular episodes.

## Import verification

All 20 regular episodes were inserted and read back in `kupa_prod.kupa` with
12,049 cues. The catalog now contains 100 episodes. No original records or logs
were replaced; the log count stayed 10,957 during import. The subsequent browser
verification search is a normal additional log entry.

Searching `ואני מאחלת לעצמי השנה` in the database-backed localhost app returns
S05E01 (כפרות), with the embedded player identifying video `iL686rbf82M`.
All 20 YouTube timing statuses remain unverified; title/link identity does not
establish subtitle synchronization. Extras and the making-of source remain out
of the regular catalog. Vercel was not deployed or reconfigured.

## Netflix timing approval — 2026-09-23

The user explicitly approved trusting Netflix times without checking YouTube
alignment. Playback jumps are now enabled for all 99 imported subtitle episodes:
98 use `youtubeTiming.status=assumed_netflix_zero` and `offsetMs=0`; S03E06 keeps
its existing verified status. This supersedes the alignment gate described above.
Source-hash and video-ID checks remain active. Buttons seek two seconds before
the Netflix cue, clamped to zero. S04E11 still has no imported subtitles because
its episode identity issue is separate from timing. No source `test` records or
search logs were changed by enabling timing.
