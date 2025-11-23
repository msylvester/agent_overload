/**
 * MongoDB Connection Pool Singleton
 *
 * Reuses connections across requests to avoid the 10-30 second
 * connection overhead on each request.
 */

import { MongoClient } from "mongodb";

let cachedClient: MongoClient | null = null;
let cachedDb: ReturnType<MongoClient["db"]> | null = null;

const MONGODB_URI = process.env.MONGODB_URI;
const DATABASE_NAME = "companies";

if (!MONGODB_URI) {
  console.warn("MONGODB_URI environment variable is not set");
}

/**
 * Get a cached MongoDB client connection.
 * Creates a new connection on first call, reuses on subsequent calls.
 */
export async function getMongoClient(): Promise<MongoClient> {
  if (cachedClient) {
    return cachedClient;
  }

  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI environment variable is not set");
  }

  const client = new MongoClient(MONGODB_URI, {
    // Note: serverApi strict mode is disabled to allow $vectorSearch
    maxPoolSize: 10,
    minPoolSize: 2,
    maxIdleTimeMS: 60000,
    connectTimeoutMS: 10000,
  });

  await client.connect();
  cachedClient = client;

  console.log("MongoDB connection pool established");
  return cachedClient;
}

/**
 * Get a cached database instance.
 */
export async function getDatabase() {
  if (cachedDb) {
    return cachedDb;
  }

  const client = await getMongoClient();
  cachedDb = client.db(DATABASE_NAME);
  return cachedDb;
}

/**
 * Get a collection from the cached database.
 */
export async function getCollection(collectionName: string) {
  const db = await getDatabase();
  return db.collection(collectionName);
}

/**
 * Close the cached connection (for cleanup/testing).
 */
export async function closeConnection(): Promise<void> {
  if (cachedClient) {
    await cachedClient.close();
    cachedClient = null;
    cachedDb = null;
    console.log("MongoDB connection closed");
  }
}
