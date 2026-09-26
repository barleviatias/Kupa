import { getDatabase } from './mongodb.mjs';
import { searchDocuments } from './subtitle-search.mjs';

export const SEARCH_CACHE_VERSION = 2;

export async function loadSearchDocuments() {
  const db = await getDatabase();
  // Fail explicitly on growth beyond this cap instead of silently dropping episodes.
  return db.collection('kupa').find({}, { projection: {
    _id: 1, episode_name: 1, episode_number: 1, season_number: 1,
    youtube_url: 1, script: 1, subtitles: 1, subtitleSchemaVersion: 1, youtubeTiming: 1,
  } }).sort({ season_number: 1, episode_number: 1 }).limit(151).maxTimeMS(5000).toArray();
}

export function searchConfig() {
  return {
    enabled: process.env.TIMESTAMP_SEARCH_ENABLED !== 'false',
    allowlist: process.env.TIMESTAMP_EPISODE_IDS === undefined ? null
      : process.env.TIMESTAMP_EPISODE_IDS.split('|').filter(Boolean),
  };
}

export function searchConfigKey() {
  const { enabled, allowlist } = searchConfig();
  return JSON.stringify([SEARCH_CACHE_VERSION, enabled, allowlist?.sort() ?? null]);
}

export function computeSearchResults(documents, query) {
  if (documents.length > 150) throw new Error('Catalog limit exceeded');
  return searchDocuments(documents, query, searchConfig());
}
