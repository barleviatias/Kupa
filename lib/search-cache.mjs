// Cache computed results for a few minutes so repeated popular searches avoid
// fetching and scanning every transcript. Keep requests and their logs separate.
export function createSearchResultsCache(load, { ttl = 300000, maxEntries = 20, now = Date.now } = {}) {
  const entries = new Map();
  return async query => {
    const existing = entries.get(query);
    if (existing && now() < existing.expires) {
      entries.delete(query);
      entries.set(query, existing);
      return existing.promise;
    }
    entries.delete(query);
    const entry = { expires: now() + ttl };
    entry.promise = Promise.resolve().then(() => load(query)).catch(error => {
      if (entries.get(query) === entry) entries.delete(query);
      throw error;
    });
    entries.set(query, entry);
    while (entries.size > maxEntries) entries.delete(entries.keys().next().value);
    return entry.promise;
  };
}
