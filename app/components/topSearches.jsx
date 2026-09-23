import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function TopSearches() {
  const [searches, setSearches] = useState([]);
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/top-searches', { signal: controller.signal })
      .then(response => response.ok ? response.json() : null)
      .then(data => { if (Array.isArray(data?.searches)) setSearches(data.searches); })
      .catch(() => {});
    return () => controller.abort();
  }, []);
  if (!searches.length) return null;
  const items = duplicate => (
    <ul className="popular-searches-group" aria-hidden={duplicate ? 'true' : undefined}>
      {searches.map(({ query }) => <li key={query}>
        <Link href={`/?${new URLSearchParams({ q: query })}`} prefetch={false} scroll={false}
          tabIndex={duplicate ? -1 : undefined}
          aria-label={query}
          className="inline-flex items-center gap-2 rounded-full border border-red-100 bg-white px-4 py-2 text-sm text-gray-700 hover:border-custom-red hover:text-custom-red focus-visible:outline focus-visible:outline-2 focus-visible:outline-custom-red">
          <span dir="auto">{query}</span>
        </Link>
      </li>)}
    </ul>
  );
  return (
    <section aria-label="עשרת החיפושים הנפוצים" className="w-full max-w-4xl mb-8 min-w-0">
      <div className="flex items-center gap-3 mb-3 px-1">
        <h2 className="text-sm font-semibold text-gray-700">בסבתא כנעם החיפושים הכי חמים 🔥</h2>
        <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-custom-red">כל הזמנים</span>
      </div>
      <div className="popular-searches-window">
        <div className="popular-searches-track">{items(false)}{items(true)}</div>
      </div>
    </section>
  );
}
