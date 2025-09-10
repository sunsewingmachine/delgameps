import { MongoClient, Db } from 'mongodb';

/*
Purpose: MongoDB connection utility for PaySkill app. Handles connection to MongoDB Atlas
using native MongoDB driver with credentials from environment variables. Implements 
connection caching to prevent multiple connections in development mode.
*/

const MONGODB_URI = process.env.MONGODB_URI!;
const MONGODB_DBNAME = process.env.MONGODB_DBNAME!;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

if (!MONGODB_DBNAME) {
  throw new Error('Please define the MONGODB_DBNAME environment variable inside .env.local');
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = (global as any).mongodb;

if (!cached) {
  cached = (global as any).mongodb = { conn: null, promise: null };
}

async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    cached.promise = MongoClient.connect(MONGODB_URI, opts).then((client) => {
      return {
        client: client,
        db: client.db(MONGODB_DBNAME),
      };
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectToDatabase;
