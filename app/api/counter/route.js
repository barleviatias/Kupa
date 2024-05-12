import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = 'test';

export const config = {
  api: {
    externalResolver: true,
  },
};

export async function GET() {
  try {
    await mongoose.connect(MONGO_URI, {
      dbName: DB_NAME,
    });

    // Check if the connection is successful
    const db = mongoose.connection.db;
    const collection = db.collection('log');

    // Get the document count directly
    const documentCount = await collection.countDocuments();

    console.log('Document count:', documentCount);

    await mongoose.disconnect();

    return new Response(JSON.stringify({ documentCount }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    return new Response(JSON.stringify({ error: 'MongoDB connection failed' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  }
}