export const normalize = value => String(value ?? '').normalize('NFD').replace(/[\u0591-\u05C7]/g, '')
  .replace(/[^א-ת0-9]+/g, ' ').trim().replace(/\s+/g, ' ');

// The show uses both spellings. Keep one canonical query for logs/cache while
// searching both original subtitle and legacy transcript text.
export const canonicalizeQuery = query => query.replaceAll('פרינציפ', 'פרנציפ');
export function searchVariants(query) {
  const canonical = canonicalizeQuery(query);
  const alternate = canonical.replaceAll('פרנציפ', 'פרינציפ');
  return alternate === canonical ? [canonical] : [canonical, alternate];
}

export function validateQuery(value) {
  if (typeof value !== 'string' || value.length > 200) return null;
  const normalized = normalize(value);
  if (!/[א-ת]/.test(normalized) || normalized.split(' ').length > 20) return null;
  return canonicalizeQuery(normalized);
}

export function youtubeId(value) {
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    let id;
    if (url.hostname === 'youtu.be') id = url.pathname.slice(1);
    else if (['youtube.com', 'www.youtube.com', 'm.youtube.com'].includes(url.hostname)) {
      id = url.pathname === '/watch' ? url.searchParams.get('v') : /^\/embed\/([\w-]+)$/.exec(url.pathname)?.[1];
    }
    return /^[\w-]{11}$/.test(id || '') ? id : null;
  } catch { return null; }
}

export function playbackSeconds(ms) {
  return Math.max(0, Math.floor((ms - 2000) / 1000));
}
export function formatTime(ms) {
  const seconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
}

export function timedMatches(doc, query) {
  const { subtitles, youtubeTiming: timing } = doc;
  const search = subtitles?.search;
  if (search?.normalizationVersion !== 1 || !Array.isArray(search.spans)
    || !Array.isArray(subtitles.cues) || typeof search.text !== 'string'
    || search.text.length > 500000 || subtitles.cues.length > 10000 || !query) return [];
  const matches = [];
  let cursor = 0, attempts = 0;
  while (matches.length < 30 && attempts++ < 1000) {
    const start = search.text.indexOf(query, cursor);
    if (start < 0) break;
    const end = start + query.length;
    cursor = start + 1;
    // Preserve the live search's Hebrew prefix/suffix matching (שוער also matches שוערת).
    const spans = search.spans.filter(span => span.start < end && span.end > start);
    const cues = spans.map(span => subtitles.cues[span.cueId]);
    if (!cues.length || cues.some(cue => !cue || !Number.isFinite(cue.startMs) || !Number.isFinite(cue.endMs))) continue;
    // Do not join a phrase across a scene break or a very long subtitle window.
    if (cues.at(-1).endMs - cues[0].startMs > 30000
      || cues.some((cue, index) => index > 0 && cue.startMs - cues[index - 1].endMs > 5000)) continue;
    const enabledTiming = (timing?.status === 'verified'
      || (timing?.status === 'assumed_netflix_zero' && timing.offsetMs === 0)) && Number.isFinite(timing.offsetMs)
      && typeof subtitles.sourceHash === 'string' && timing.sourceHash === subtitles.sourceHash
      && timing.videoId === youtubeId(doc.youtube_url);
    matches.push({ text: cues.map(cue => cue.text).join(' '), cueIds: spans.map(span => span.cueId),
      sourceStartMs: cues[0].startMs, sourceEndMs: Math.max(...cues.map(cue => cue.endMs)),
      playbackStartMs: enabledTiming ? Math.max(0, cues[0].startMs + timing.offsetMs) : null });
  }
  return matches;
}

// Keep offsets into original text so legacy excerpts preserve punctuation and niqqud.
function normalizeWithOffsets(value) {
  let text = '', separator = false;
  const offsets = [];
  for (let i = 0; i < value.length; i++) {
    const part = value[i].normalize('NFD').replace(/[\u0591-\u05C7]/g, '');
    if (!part) continue;
    if (!/[א-ת0-9]/.test(part)) { separator = Boolean(text); continue; }
    if (separator) { text += ' '; offsets.push(i); separator = false; }
    text += part; offsets.push(i);
  }
  return { text, offsets };
}

// Preserve loose legacy matching with bounded gaps and guaranteed progress.
export function legacyMatches(script, query) {
  if (typeof script !== 'string' || script.length > 500000 || !query) return [];
  const { text, offsets } = normalizeWithOffsets(script);
  const words = query.split(' ');
  const first = words[0];
  const matches = [];
  let cursor = 0, attempts = 0;
  while (matches.length < 30 && attempts++ < 1000) {
    const start = text.indexOf(first, cursor);
    if (start < 0) break;
    cursor = start + 1;
    let end = start + first.length, found = true;
    for (const word of words.slice(1)) {
      const next = text.indexOf(word, end);
      if (next < 0 || next - end > 120) { found = false; break; }
      end = next + word.length;
    }
    if (found) {
      matches.push({ text: script.slice(Math.max(0, offsets[start] - 30), Math.min(script.length, offsets[end - 1] + 31)),
        sourceStartMs: null, sourceEndMs: null, playbackStartMs: null, cueIds: [] });
      cursor = end;
    }
  }
  return matches;
}

export function searchDocuments(documents, query, { enabled = false, allowlist = [] } = {}) {
  const variants = searchVariants(query);
  return documents.flatMap(doc => {
    const timed = enabled && allowlist.includes(String(doc._id)) && doc.subtitleSchemaVersion === 1;
    const matches = variants.flatMap(variant => timed ? timedMatches(doc, variant) : legacyMatches(doc.script, variant)).slice(0, 30);
    return matches.length ? [{ _id: String(doc._id), episode_name: doc.episode_name,
      episode_number: doc.episode_number, season_number: doc.season_number,
      url: doc.youtube_url, matches, context: matches.map(match => match.text) }] : [];
  }).slice(0, 150);
}
