import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = 'test';
const CONTEXT_LEN = 50;

export async function GET(request) {
  try {
    await mongoose.connect(MONGO_URI, {
      dbName: DB_NAME,
    });

    const db = mongoose.connection.db;
    const collection = db.collection('kupa');
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');
    console.log('q:', q);

    const logCollection = db.collection('log');
    const searchData = {
      query: q,
      timestamp: new Date(),
    };
    await logCollection.insertOne(searchData);

    const regex = new RegExp(q, 'i');
    const documents = await collection.find({ script: regex }).toArray();

    const results = documents.map((doc) => {
      const script = doc.script;
      const start = script.search(regex);
      const end = start + q.length;

      let context_start = start;
      while (context_start > 0 && doc["script"][context_start - 1] !== '\n') {
        context_start--;
      }

      const context_end = Math.min(end + CONTEXT_LEN, doc.script.length);
      const context = doc.script.slice(context_start, context_end).trim();

      return {
        _id: doc._id,
        episode_name: doc.episode_name,
        episode_number: doc.episode_number,
        season_number: doc.season_number,
        url: doc.youtube_url,
        context: context,
      };
    });

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error retrieving documents:', error);
    return new Response(JSON.stringify({ error: 'An error occurred while retrieving documents.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  } finally {
    await mongoose.disconnect();
  }
}