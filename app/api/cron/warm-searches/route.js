import { getDatabase } from '@/lib/mongodb.mjs';
import { loadSearchDocuments, computeSearchResults, searchConfigKey } from '@/lib/search-service.mjs';
import { loadTopSearchGroups } from '@/lib/top-searches-db.mjs';
import { warmWeeklySearchResults } from '@/lib/weekly-search-cache.mjs';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request) {
  if (!process.env.CRON_SECRET || request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }
  try {
    const count = await warmWeeklySearchResults({
      loadGroups: loadTopSearchGroups,
      loadDocuments: loadSearchDocuments,
      computeResults: computeSearchResults,
      save: async (entries, computedAt, expiresAt) => {
        const db = await getDatabase();
        const configKey = searchConfigKey();
        await db.collection('search_cache').bulkWrite(entries.map(({ query, results }) => ({
          replaceOne: { filter: { _id: query }, replacement: { _id: query, results, computedAt, expiresAt, configKey }, upsert: true },
        })), { ordered: false });
      },
    });
    return Response.json({ warmed: count }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    console.error('Weekly search cache refresh failed');
    return Response.json({ error: 'Cache refresh failed' }, { status: 503 });
  }
}
