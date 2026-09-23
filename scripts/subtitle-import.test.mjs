import test from 'node:test';
import assert from 'node:assert/strict';
import { hash, safePath, validateCues, buildSubtitleFields } from '../lib/subtitle-import.mjs';

const source = () => ({ season: 6, episode: 1, netflixId: 'source-id', sha256: hash('<fixture/>'),
  cueCount: 2, firstStartMs: 0, lastEndMs: 2000,
  cues: [{ startMs: 0, endMs: 1200, text: 'שָׁלוֹם,' }, { startMs: 1000, endMs: 2000, text: 'עולם!' }] });

test('cue validation allows overlap but rejects invalid and unordered times', () => {
  assert.doesNotThrow(() => validateCues(source()));
  for (const value of [-1, NaN, Infinity, 1.5, 1200]) {
    const input = source(); input.cues[0].startMs = value;
    assert.throws(() => validateCues(input));
  }
  const input = source(); input.cues[0].startMs = 1100; input.firstStartMs = 1100;
  assert.throws(() => validateCues(input), /Unordered/);
});

test('import fields preserve source identity and cross-cue phrase offsets without assuming playback timing', () => {
  const fields = buildSubtitleFields(source(), { youtubeId: 'X_EbFZ_UZBc' });
  assert.equal(fields.subtitles.search.text, 'שלום עולם');
  assert.deepEqual(fields.subtitles.search.spans, [{ start: 0, end: 4, cueId: 0 }, { start: 5, end: 9, cueId: 1 }]);
  assert.equal(fields.subtitles.sourceHash, source().sha256);
  assert.equal(fields.youtubeTiming.offsetMs, null);
  assert.equal(fields.youtubeTiming.status, 'unverified');
});

test('source paths cannot escape the input directory', () => {
  assert.throws(() => safePath('/tmp/source', '../secret'));
  assert.throws(() => safePath('/tmp/source', '/secret'));
  assert.equal(safePath('/tmp/source', 'season-06/episode.json'), '/tmp/source/season-06/episode.json');
});
