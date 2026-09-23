import { MongoClient } from 'mongodb';

// Cache a promise so simultaneous search/counter calls share the same pool.
export function createConnectionCache() {
  let pending;
  return function connect(factory) {
    if (!pending) pending = Promise.resolve().then(factory).catch(error => { pending = undefined; throw error; });
    return pending;
  };
}
const cache = globalThis.kupaMongoCache || (globalThis.kupaMongoCache = createConnectionCache());
export async function getDatabase() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error('MONGO_URI is required');
  const client = await cache(async () => {
    const next = new MongoClient(uri, { serverSelectionTimeoutMS: 5000, maxPoolSize: 10 });
    try { await next.connect(); return next; }
    catch (error) { await next.close(); throw error; }
  });
  return client.db(process.env.MONGO_DB_NAME || 'kupa_prod');
}
