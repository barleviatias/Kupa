import test from 'node:test';
import assert from 'node:assert/strict';
import { rankSearches, createTopSearchesCache } from '../lib/top-searches.mjs';
import { createSearchHandler } from '../lib/search-handler.mjs';

test('top searches combine punctuation, niqqud and spacing variants and reject invalid logs', () => {
  const result = rankSearches([
    { _id: 'טוב, שוער!', count: 4 }, { _id: 'טוב   שוער', count: 3 },
    { _id: 'שָׁלוֹם', count: 2 }, { _id: 'שלום', count: 1 },
    ...[null, ['שלום'], {}, '', 'hello', '!!!', 'א'.repeat(201)].map(_id => ({ _id, count: 100 })),
    { _id: 'אחר', count: -1 }, { _id: 'אחר', count: 1.5 },
  ]);
  assert.deepEqual(result, [{ query: 'טוב שוער', count: 7 }, { query: 'שלום', count: 3 }]);
});
test('intentional spelling variants share one popular-search count', () => {
  assert.deepEqual(rankSearches([
    { _id: 'פרנציפ', count: 4 }, { _id: 'פרינציפ', count: 3 },
  ]), [{ query: 'פרנציפ', count: 7 }]);
});
test('ranking returns exactly ten most frequent searches and has stable ties', () => {
  const groups = Array.from({ length: 15 }, (_, i) => ({ _id: `משפט ${i}`, count: i + 1 }));
  assert.deepEqual(rankSearches(groups).map(row => row.count), [15,14,13,12,11,10,9,8,7,6]);
  const tied = [{ _id: 'ב', count: 2 }, { _id: 'א', count: 2 }];
  assert.deepEqual(rankSearches(tied), rankSearches([...tied].reverse()));
});
test('ranking cache shares concurrent reads, expires and retries failed loads', async () => {
  let reads = 0, clock = 0;
  const cached = createTopSearchesCache(async () => { reads++; return [{ _id: 'שלום', count: reads }]; }, 10, () => clock);
  const [a,b] = await Promise.all([cached(), cached()]);
  assert.deepEqual(a,b); assert.equal(reads, 1);
  await cached(); assert.equal(reads, 1);
  clock = 11; await cached(); assert.equal(reads, 2);
  let fail = true;
  const retry = createTopSearchesCache(async () => { if (fail) throw new Error('offline'); return []; });
  await assert.rejects(retry()); fail = false; assert.deepEqual(await retry(), []);
});
test('cancelled URL navigation does not log an abandoned request', async () => {
  const controller = new AbortController();
  let logs = 0;
  const handler = createSearchHandler({ loadDocuments: async () => { controller.abort(); return []; },
    config: () => ({}), logSearch: async () => { logs++; } });
  const response = await handler(new Request('http://localhost/api/search?q=' + encodeURIComponent('שלום'), { signal: controller.signal }));
  assert.equal(response.status, 499); assert.equal(logs, 0);
});
