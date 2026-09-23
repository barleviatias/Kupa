# Initial audit — 2026-09-23

Scope: source and setup review, not a live database, deployment, or dependency
vulnerability audit. The runtime findings below remain open.

## Prioritized findings

1. **Critical: empty normalized searches can loop indefinitely.** In
   `app/api/search/route.js`, empty, whitespace-only, or Latin-only input creates
   an empty regex matching every transcript. At the end of context extraction it
   still matches the empty suffix, and `lastEnd` stops advancing. Missing `q`
   instead throws during normalization. Validate before connecting or logging,
   reject empty normalized queries, and guarantee loop progress. Add regressions.
2. **High: requests disconnect a shared Mongoose connection.** Both API routes
   connect and disconnect per request, so one request can close another's active
   connection. The counter also lacks cleanup on failures. Add a shared cached
   connection helper with predictable error handling.
3. **High: search work and writes are unbounded.** Regex searches load all matching
   documents with `toArray()`, extract all contexts, and log input without length
   limits or rate limiting. Bound queries, results, contexts, and execution time;
   review indexing and pagination against real data, and define log retention.
4. **Medium: client failures and races are not handled.** In `app/page.js`, rejected
   fetches can leave loading enabled. Failed searches can retain old result counts,
   and overlapping responses can replace newer results. Add error state,
   `try/finally`, cancellation or request ordering, and `URLSearchParams` instead
   of raw query interpolation.
5. **Medium: accessibility and video parsing need attention.** The root declares
   English despite Hebrew content. The search input, icon-only links, and iframes
   need accessible labels or titles. Splitting video URLs on `watch?v=` fails for
   other YouTube URL formats.
6. **Maintenance: review dependencies and add regression coverage.** Next.js and
   eslint-config-next are pinned to 14.2.3, and there is no test script. Check
   current official security advisories and compatibility before upgrading. No
   dependency vulnerability claims have been verified in this audit.
7. **Privacy and operations: reduce verbose search logging.** The API prints
   queries and transcript contexts and stores queries with timestamps. Define
   retention and minimize logs. Review intended behavior of external analytics
   and YouTube embeds.

## Setup addressed

Added contributor guidance, local `.env`, and credential-free `.env.example`;
expanded ignore rules to protect environment files; documented database setup.
The local URI requires a running MongoDB instance and populated episode data.
