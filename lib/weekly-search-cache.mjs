import { rankSearches } from './top-searches.mjs';

export const WEEKLY_CACHE_TTL_MS = 8 * 24 * 60 * 60 * 1000;

export function createWeeklySearchLoader(read, compute) {
  return async query => {
    try {
      const cached = await read(query);
      if (cached !== null) return cached;
    } catch {
      // A broken optional cache must not prevent the normal search.
    }
    return compute(query);
  };
}

export async function readWeeklySearchResult(collection, query, configKey, now = new Date()) {
  const entry = await collection.findOne({ _id: query }, { projection: { results: 1, expiresAt: 1, configKey: 1 }, maxTimeMS: 5000 });
  return entry?.configKey === configKey && entry.expiresAt instanceof Date && entry.expiresAt > now
    && Array.isArray(entry.results) ? entry.results : null;
}

export async function warmWeeklySearchResults({ loadGroups, loadDocuments, computeResults, save }, now = new Date()) {
  const groups = await loadGroups();
  if (groups.length > 50000) throw new Error('Search ranking capacity exceeded');
  const searches = rankSearches(groups);
  if (!searches.length) return 0;
  const documents = await loadDocuments();
  if (documents.length > 150) throw new Error('Catalog limit exceeded');
  const entries = searches.map(({ query }) => ({ query, results: computeResults(documents, query) }));
  await save(entries, now, new Date(now.getTime() + WEEKLY_CACHE_TTL_MS));
  return entries.length;
}
