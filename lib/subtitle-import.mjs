import { createHash } from 'node:crypto';
import { resolve, relative, isAbsolute } from 'node:path';
import { normalize } from './subtitle-search.mjs';

export const hash = value => createHash('sha256').update(value).digest('hex');

export function safePath(root, file) {
  if (typeof file !== 'string' || isAbsolute(file)) throw new Error('Source path must be relative');
  const path = resolve(root, file);
  const rel = relative(resolve(root), path);
  if (!rel || rel === '..' || rel.startsWith('../')) throw new Error('Source path escapes subtitle directory');
  return path;
}

export function validateCues(source) {
  if (!Array.isArray(source.cues) || !source.cues.length) throw new Error('Missing cues');
  if (source.cueCount !== source.cues.length) throw new Error('Cue count mismatch');
  let previous = -1;
  for (const cue of source.cues) {
    if (!Number.isSafeInteger(cue.startMs) || !Number.isSafeInteger(cue.endMs)
      || cue.startMs < 0 || cue.endMs <= cue.startMs) throw new Error('Invalid cue duration');
    if (cue.startMs < previous) throw new Error('Unordered cue starts');
    if (typeof cue.text !== 'string' || !cue.text.trim()) throw new Error('Empty cue text');
    previous = cue.startMs;
  }
  if (!source.cues.some(cue => /[א-ת]/.test(cue.text))) throw new Error('No Hebrew subtitle text');
  if (source.firstStartMs !== source.cues[0].startMs
    || source.lastEndMs !== source.cues.at(-1).endMs) throw new Error('Cue boundary metadata mismatch');
}

export function buildSubtitleFields(source, mapping) {
  validateCues(source);
  let text = '';
  const spans = [];
  source.cues.forEach((cue, cueId) => {
    const normalized = normalize(cue.text);
    if (!normalized) return;
    if (text) text += ' ';
    const start = text.length;
    text += normalized;
    spans.push({ start, end: text.length, cueId });
  });
  return {
    subtitleSchemaVersion: 1,
    subtitles: {
      source: 'netflix', netflixId: source.netflixId,
      sourceSeason: source.season, sourceEpisode: source.episode,
      language: 'he', sourceHash: source.sha256,
      cueHash: hash(JSON.stringify(source.cues)), importVersion: 'subtitle-v1',
      cues: source.cues.map((cue, id) => ({ id, ...cue })),
      search: { normalizationVersion: 1, text, spans },
    },
    // Cue timing alone does not establish alignment with the YouTube video.
    youtubeTiming: { videoId: mapping.youtubeId, sourceHash: source.sha256,
      status: 'unverified', offsetMs: null, checkedAt: null, checkpoints: [] },
  };
}
