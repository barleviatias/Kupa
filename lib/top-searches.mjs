import { validateQuery } from './subtitle-search.mjs';

export function rankSearches(groups) {
  const totals = new Map();
  for (const group of groups) {
    const query = validateQuery(group._id);
    if (!query || !Number.isSafeInteger(group.count) || group.count < 1) continue;
    totals.set(query, (totals.get(query) || 0) + group.count);
  }
  return [...totals].map(([query, count]) => ({ query, count }))
    .sort((a, b) => b.count - a.count || a.query.localeCompare(b.query, 'he')).slice(0, 10);
}

export function createTopSearchesCache(load, ttl = 300000, now = Date.now) {
  let cached, expires = 0, pending;
  return async () => {
    if (cached && now() < expires) return cached;
    if (!pending) pending = Promise.resolve().then(load).then(groups => {
      if (groups.length > 50000) throw new Error('Search ranking capacity exceeded');
      cached = rankSearches(groups); expires = now() + ttl; return cached;
    }).finally(() => { pending = undefined; });
    return pending;
  };
}
