import { getDatabase } from '@/lib/mongodb.mjs';
import { createSearchHandler } from '@/lib/search-handler.mjs';
import { createSearchResultsCache } from '@/lib/search-cache.mjs';
import { loadSearchDocuments, computeSearchResults, searchConfigKey } from '@/lib/search-service.mjs';
import { createWeeklySearchLoader, readWeeklySearchResult } from '@/lib/weekly-search-cache.mjs';

export const dynamic = 'force-dynamic';
const loadResults = createSearchResultsCache(createWeeklySearchLoader(
  async query => {
    const db = await getDatabase();
    return readWeeklySearchResult(db.collection('search_cache'), query, searchConfigKey());
  },
  async query => computeSearchResults(await loadSearchDocuments(), query),
));
export const GET = createSearchHandler({
  loadResults,
  logSearch: async query => {
    const db = await getDatabase();
    await db.collection('log').insertOne({ query, timestamp: new Date() });
  },
});
