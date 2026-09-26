import test from 'node:test';
import assert from 'node:assert/strict';
import { normalize, validateQuery, searchVariants, timedMatches, legacyMatches, searchDocuments, youtubeId, playbackSeconds } from '../lib/subtitle-search.mjs';
import { createSearchHandler } from '../lib/search-handler.mjs';
import { createConnectionCache } from '../lib/mongodb.mjs';
import { createSearchResultsCache } from '../lib/search-cache.mjs';
import { buildSubtitleFields } from '../lib/subtitle-import.mjs';
import { searchConfig, searchConfigKey } from '../lib/search-service.mjs';

function document() {
  const source = { netflixId: 'fixture', season: 3, episode: 6, sha256: 'hash', cueCount: 3,
    firstStartMs: 1000, lastEndMs: 12000, cues: [
      { startMs: 1000, endMs: 2000, text: 'שָׁלוֹם' },
      { startMs: 2000, endMs: 3000, text: 'עולם!' },
      { startMs: 10000, endMs: 12000, text: 'שלום עולם' },
    ] };
  const fields = buildSubtitleFields(source, { youtubeId: '3_p3Q293u44' });
  return { _id: 'fixture', script: 'משפט ישן', youtube_url: 'https://youtu.be/3_p3Q293u44', ...fields,
    youtubeTiming: { ...fields.youtubeTiming, status: 'verified', offsetMs: 0 } };
}

test('queries validate before normalization can become empty', () => {
  assert.equal(normalize(null), '');
  assert.equal(normalize(undefined), '');
  for (const query of [null, '', '  ', '?!', 'hello', '123', 'א'.repeat(201), 'א '.repeat(21)]) assert.equal(validateQuery(query), null);
  assert.equal(validateQuery('שָׁלוֹם, עולם!'), 'שלום עולם');
});
test('both intentional spellings find the same legacy and timed episodes', () => {
  assert.equal(validateQuery('זה פרינציפ'), 'זה פרנציפ');
  assert.deepEqual(searchVariants('זה פרנציפ'), ['זה פרנציפ', 'זה פרינציפ']);
  const legacy = [
    { _id: 'a', script: 'זה פרנציפ!' },
    { _id: 'b', script: 'זה פרינציפ!' },
    { _id: 'c', script: 'זה פרנסיפ!' },
  ];
  for (const spelling of ['פרנציפ', 'פרינציפ']) {
    assert.deepEqual(searchDocuments(legacy, validateQuery(`זה ${spelling}`)).map(row => row._id), ['a', 'b']);
  }
  const source = { netflixId: 'spelling', season: 1, episode: 1, sha256: 'spelling-hash', cueCount: 2,
    firstStartMs: 1000, lastEndMs: 6000, cues: [
      { startMs: 1000, endMs: 2000, text: 'זה פרנציפ' },
      { startMs: 5000, endMs: 6000, text: 'זה פרינציפ' },
    ] };
  const fields = buildSubtitleFields(source, { youtubeId: '3_p3Q293u44' });
  const timed = { _id: 'spelling', youtube_url: 'https://youtu.be/3_p3Q293u44', ...fields,
    youtubeTiming: { ...fields.youtubeTiming, status: 'verified', offsetMs: 0 } };
  const found = searchDocuments([timed], validateQuery('זה פרינציפ'), { enabled: true, allowlist: ['spelling'] });
  assert.deepEqual(found[0].matches.map(match => match.sourceStartMs), [1000, 5000]);
});
test('cross-cue and repeated phrases carry correct cue times', () => {
  const results = timedMatches(document(), 'שלום עולם');
  assert.equal(results.length, 2);
  assert.deepEqual(results.map(r => r.sourceStartMs), [1000, 10000]);
  assert.deepEqual(results[0].cueIds, [0, 1]);
  assert.equal(results[0].playbackStartMs, 1000);
  assert.equal(timedMatches(document(), 'לום').length, 2);
});
test('unknown/stale alignment never exposes playback and negative offset clamps', () => {
  for (const override of [{ status: 'unverified' }, { sourceHash: 'old' }, { videoId: 'different' }, { offsetMs: null }]) {
    const doc = document(); Object.assign(doc.youtubeTiming, override);
    assert.equal(timedMatches(doc, 'שלום')[0].playbackStartMs, null);
  }
  const doc = document(); doc.youtubeTiming.offsetMs = -2000;
  assert.equal(timedMatches(doc, 'שלום')[0].playbackStartMs, 0);
  assert.equal(playbackSeconds(1000), 0);
  assert.equal(playbackSeconds(78423), 76);
});
test('large inter-cue gaps do not create a phrase', () => {
  const doc = document(); doc.subtitles.cues[1].startMs = 9000; doc.subtitles.cues[1].endMs = 9500;
  assert.equal(timedMatches(doc, 'שלום עולם').length, 1);
});
test('user-approved Netflix timing enables jumps without claiming verification', () => {
  const doc = document();
  doc.youtubeTiming.status = 'assumed_netflix_zero';
  assert.equal(timedMatches(doc, 'שלום')[0].playbackStartMs, 1000);
  doc.youtubeTiming.offsetMs = 500;
  assert.equal(timedMatches(doc, 'שלום')[0].playbackStartMs, null);
  doc.youtubeTiming.offsetMs = 0;
  doc.youtubeTiming.sourceHash = 'changed';
  assert.equal(timedMatches(doc, 'שלום')[0].playbackStartMs, null);
  doc.youtubeTiming.sourceHash = 'hash';
  doc.youtubeTiming.videoId = 'other';
  assert.equal(timedMatches(doc, 'שלום')[0].playbackStartMs, null);
});
test('feature and allowlist gate timed search; legacy preserves text', () => {
  const doc = document();
  assert.equal(searchDocuments([doc], 'שלום', { enabled: false, allowlist: ['fixture'] }).length, 0);
  assert.equal(searchDocuments([doc], 'שלום', { enabled: true, allowlist: [] }).length, 0);
  assert.equal(searchDocuments([doc], 'שלום', { enabled: true, allowlist: ['fixture'] }).length, 1);
  assert.equal(legacyMatches('שָׁלוֹם, עולם!', 'שלום עולם')[0].text, 'שָׁלוֹם, עולם!');
  assert.equal(legacyMatches('שלום '.repeat(10000), 'שלום').length, 30);
  assert.deepEqual(legacyMatches('שלום', ''), []);
});
test('production defaults restore approved timing without enabling unverified episodes or stale caches', () => {
  const previousFlag = process.env.TIMESTAMP_SEARCH_ENABLED;
  const previousIds = process.env.TIMESTAMP_EPISODE_IDS;
  try {
    delete process.env.TIMESTAMP_SEARCH_ENABLED;
    delete process.env.TIMESTAMP_EPISODE_IDS;
    const config = searchConfig();
    assert.deepEqual(config, { enabled: true, allowlist: null });
    const doc = document();
    assert.equal(searchDocuments([doc], 'שלום', config)[0].matches[0].playbackStartMs, 1000);
    doc.youtubeTiming.status = 'assumed_netflix_zero';
    assert.equal(searchDocuments([doc], 'שלום', config)[0].matches[0].playbackStartMs, 1000);
    for (const timing of [{ status: 'unverified' }, { sourceHash: 'stale' }, { videoId: 'different' }]) {
      const unapproved = document(); Object.assign(unapproved.youtubeTiming, timing);
      assert.deepEqual(searchDocuments([unapproved], 'שלום', config), []);
      assert.equal(searchDocuments([unapproved], 'משפט ישן', config)[0].matches[0].playbackStartMs, null);
    }
    const defaultKey = searchConfigKey();
    process.env.TIMESTAMP_SEARCH_ENABLED = 'false';
    assert.equal(searchDocuments([doc], 'שלום', searchConfig()).length, 0);
    assert.notEqual(searchConfigKey(), defaultKey);
    process.env.TIMESTAMP_SEARCH_ENABLED = 'true';
    process.env.TIMESTAMP_EPISODE_IDS = '';
    assert.equal(searchDocuments([doc], 'שלום', searchConfig()).length, 0);
    assert.notEqual(searchConfigKey(), defaultKey);
  } finally {
    if (previousFlag === undefined) delete process.env.TIMESTAMP_SEARCH_ENABLED;
    else process.env.TIMESTAMP_SEARCH_ENABLED = previousFlag;
    if (previousIds === undefined) delete process.env.TIMESTAMP_EPISODE_IDS;
    else process.env.TIMESTAMP_EPISODE_IDS = previousIds;
  }
});
test('YouTube parsing rejects foreign hosts and supports common formats', () => {
  assert.equal(youtubeId('https://youtu.be/3_p3Q293u44?t=5'), '3_p3Q293u44');
  assert.equal(youtubeId('https://www.youtube.com/watch?v=3_p3Q293u44&si=foo'), '3_p3Q293u44');
  assert.equal(youtubeId('https://youtube.com.evil.test/watch?v=3_p3Q293u44'), null);
});
test('handler validates before database/logging, distinguishes empty from failure', async () => {
  let reads = 0, logs = 0;
  const handler = createSearchHandler({ loadDocuments: async () => { reads++; return [document()]; },
    logSearch: async () => { logs++; }, config: () => ({ enabled: true, allowlist: ['fixture'] }) });
  for (const query of ['', '?q=', '?q=hello']) assert.equal((await handler(new Request('http://localhost/search' + query))).status, 400);
  assert.equal(reads, 0); assert.equal(logs, 0);
  const response = await handler(new Request('http://localhost/search?q=' + encodeURIComponent('לא נמצא')));
  assert.equal(response.status, 200); assert.deepEqual(await response.json(), []);
  const failed = createSearchHandler({ loadDocuments: async () => { throw new Error('secret'); }, logSearch: async () => {}, config: () => ({}) });
  const error = await failed(new Request('http://localhost/search?q=' + encodeURIComponent('שלום')));
  assert.equal(error.status, 500); assert.ok(!(await error.text()).includes('secret'));
});
test('simultaneous connections share a pool and retry after a failure', async () => {
  let connects = 0;
  const cached = createConnectionCache(), client = {};
  const factory = async () => { connects++; await new Promise(resolve => setTimeout(resolve, 5)); return client; };
  assert.deepEqual(await Promise.all([cached(factory), cached(factory)]), [client, client]);
  assert.equal(connects, 1);
  const retry = createConnectionCache();
  await assert.rejects(retry(async () => { throw new Error('unavailable'); }));
  assert.equal(await retry(factory), client);
});
test('computed searches are cached by normalized query, expire, and still log each request', async () => {
  let scans = 0, logs = 0, clock = 0;
  const loadResults = createSearchResultsCache(async () => { scans++; return []; }, { ttl: 10, now: () => clock });
  const handler = createSearchHandler({ loadResults, logSearch: async () => { logs++; } });
  const request = query => new Request('http://localhost/search?q=' + encodeURIComponent(query));
  const responses = await Promise.all([handler(request('שלום!')), handler(request('שלום'))]);
  assert.deepEqual(responses.map(response => response.status), [200, 200]);
  assert.equal(scans, 1); assert.equal(logs, 2);
  clock = 11;
  assert.equal((await handler(request('שלום'))).status, 200);
  assert.equal(scans, 2); assert.equal(logs, 3);
});
test('failed search computations are not cached', async () => {
  let scans = 0;
  const loadResults = createSearchResultsCache(async () => {
    if (++scans === 1) throw new Error('temporary failure');
    return [];
  });
  const handler = createSearchHandler({ loadResults, logSearch: async () => {} });
  const request = () => new Request('http://localhost/search?q=' + encodeURIComponent('שלום'));
  assert.equal((await handler(request())).status, 500);
  assert.equal((await handler(request())).status, 200);
  assert.equal(scans, 2);
});
