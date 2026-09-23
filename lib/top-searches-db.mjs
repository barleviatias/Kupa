import { getDatabase } from './mongodb.mjs';

export async function loadTopSearchGroups() {
  const db = await getDatabase();
  return db.collection('log').aggregate([
    // Older log entries use search_term; newer entries use query.
    { $project: { term: { $cond: [{ $eq: [{ $type: '$query' }, 'string'] }, '$query', '$search_term'] } } },
    { $match: { $expr: { $eq: [{ $type: '$term' }, 'string'] } } },
    { $match: { $expr: { $lte: [{ $strLenCP: '$term' }, 200] } } },
    { $group: { _id: '$term', count: { $sum: 1 } } },
    { $limit: 50001 },
  ], { maxTimeMS: 5000, allowDiskUse: true }).toArray();
}
