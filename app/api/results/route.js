import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = 'test';

export async function GET(request) {
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
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    return new Response(JSON.stringify({ error: 'MongoDB connection failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}