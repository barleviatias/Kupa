import { validateQuery, searchDocuments } from './subtitle-search.mjs';

export function createSearchHandler({ loadDocuments, logSearch, config, loadResults }) {
  const resolveResults = loadResults || (async query => {
    const documents = await loadDocuments();
    if (documents.length > 150) throw new Error('Catalog limit exceeded');
    return searchDocuments(documents, query, config(documents));
  });
  return async request => {
    const query = validateQuery(new URL(request.url).searchParams.get('q'));
    if (!query) return Response.json({ error: 'יש להזין משפט בעברית באורך של עד 200 תווים ו־20 מילים.' }, { status: 400 });
    try {
      const results = await resolveResults(query);
      if (request.signal.aborted) return new Response(null, { status: 499 });
      await logSearch(query);
      return Response.json(results, { headers: { 'Cache-Control': 'no-store' } });
    } catch {
      return Response.json({ error: 'החיפוש נכשל. נסו שוב בעוד רגע.' }, { status: 500 });
    }
  };
}
