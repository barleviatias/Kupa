import { getDatabase } from '@/lib/mongodb.mjs';
export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    const documentCount = await (await getDatabase()).collection('log').countDocuments({}, { maxTimeMS: 5000 });
    return Response.json({ documentCount }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ error: 'MongoDB connection failed' }, { status: 500 });
  }
}
