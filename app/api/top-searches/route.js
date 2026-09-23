import { createTopSearchesCache } from '@/lib/top-searches.mjs';
import { loadTopSearchGroups } from '@/lib/top-searches-db.mjs';

export const dynamic = 'force-dynamic';
const loadTopSearches = createTopSearchesCache(loadTopSearchGroups, 60000);
export async function GET() {
  try {
    return Response.json({ searches: await loadTopSearches() }, { headers: { 'Cache-Control': 'public, max-age=30, s-maxage=60' } });
  } catch {
    return Response.json({ error: 'לא ניתן לטעון את החיפושים הנפוצים כרגע.' }, { status: 503 });
  }
}
