import test from 'node:test';
import assert from 'node:assert/strict';
import { createWeeklySearchLoader, readWeeklySearchResult, warmWeeklySearchResults, WEEKLY_CACHE_TTL_MS } from '../lib/weekly-search-cache.mjs';

test('cache hits avoid scans; misses and cache failures fall back to live search', async () => {
  let scans = 0;
  const hit = createWeeklySearchLoader(async () => [], async () => { scans++; return ['live']; });
  assert.deepEqual(await hit('שלום'), []);
  assert.equal(scans, 0);
  const miss = createWeeklySearchLoader(async () => null, async () => { scans++; return ['live']; });
  assert.deepEqual(await miss('שלום'), ['live']);
  const failure = createWeeklySearchLoader(async () => { throw new Error('cache unavailable'); }, async () => { scans++; return ['live']; });
  assert.deepEqual(await failure('שלום'), ['live']);
  assert.equal(scans, 2);
});

test('weekly refresh ranks all-time searches, fetches documents once, and saves top ten', async () => {
  const now = new Date('2026-09-24T00:00:00Z');
  let reads = 0, saved;
  const count = await warmWeeklySearchResults({
    loadGroups: async () => Array.from({ length: 11 }, (_, index) => ({ _id: `משפט ${index}`, count: index + 1 })),
    loadDocuments: async () => { reads++; return [{ _id: 'episode' }]; },
    computeResults: (documents, query) => [{ _id: documents[0]._id, query }],
    save: async (...args) => { saved = args; },
  }, now);
  assert.equal(count, 10);
  assert.equal(reads, 1);
  assert.equal(saved[0][0].query, 'משפט 10');
  assert.equal(saved[0].some(entry => entry.query === 'משפט 0'), false);
  assert.deepEqual(saved[0][0].results, [{ _id: 'episode', query: 'משפט 10' }]);
  assert.equal(saved[1], now);
  assert.equal(saved[2].getTime() - now.getTime(), WEEKLY_CACHE_TTL_MS);
});

test('valid empty results are cache hits; expired and changed-config entries miss', async () => {
  const now = new Date('2026-09-24T00:00:00Z');
  const collection = { findOne: async () => ({ configKey: 'v1', expiresAt: new Date(now.getTime() + 1000), results: [] }) };
  assert.deepEqual(await readWeeklySearchResult(collection, 'שלום', 'v1', now), []);
  assert.equal(await readWeeklySearchResult(collection, 'שלום', 'v2', now), null);
  assert.equal(await readWeeklySearchResult(collection, 'שלום', 'v1', new Date(now.getTime() + 1000)), null);
  collection.findOne = async () => null;
  assert.equal(await readWeeklySearchResult(collection, 'שלום', 'v1', now), null);
});

test('failed computation does not publish partial refreshed results', async () => {
  let saved = false;
  await assert.rejects(warmWeeklySearchResults({
    loadGroups: async () => [{ _id: 'שלום', count: 2 }, { _id: 'עולם', count: 1 }],
    loadDocuments: async () => [],
    computeResults: (_, query) => { if (query === 'עולם') throw new Error('failed'); return []; },
    save: async () => { saved = true; },
  }));
  assert.equal(saved, false);
});
