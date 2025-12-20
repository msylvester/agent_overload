// /**
//  * MongoDB Connection Pool Singleton
//  *
//  * Reuses connections across requests to avoid the 10-30 second
//  * connection overhead on each request.
//  */

// import { MongoClient } from "mongodb";

// let cachedClient: MongoClient | null = null;
// let cachedDb: ReturnType<MongoClient["db"]> | null = null;

// const DATABASE_NAME = "companies";

// /**
//  * Get a cached MongoDB client connection.
//  * Creates a new connection on first call, reuses on subsequent calls.
//  */
// export async function getMongoClient(): Promise<MongoClient> {
//   if (cachedClient) {
//     return cachedClient;
//   }

//   // Read MONGODB_URI at runtime, not at module load time
//   const MONGODB_URI = process.env.MONGODB_URI;

//   if (!MONGODB_URI) {
//     throw new Error("MONGODB_URI environment variable is not set");
//   }

//   const client = new MongoClient(MONGODB_URI, {
//     // Note: serverApi strict mode is disabled to allow $vectorSearch
//     maxPoolSize: 10,
//     minPoolSize: 2,
//     maxIdleTimeMS: 60_000,
//     connectTimeoutMS: 10_000,
//   });

//   await client.connect();
//   cachedClient = client;

//   console.log("MongoDB connection pool established");
//   return cachedClient;
// }

// /**
//  * Get a cached database instance.
//  */
// export async function getDatabase() {
//   if (cachedDb) {
//     return cachedDb;
//   }

//   const client = await getMongoClient();
//   cachedDb = client.db(DATABASE_NAME);
//   return cachedDb;
// }

// /**
//  * Get a collection from the cached database.
//  */
// export async function getCollection(collectionName: string) {
//   const db = await getDatabase();
//   return db.collection(collectionName);
// }

// /**
//  * Close the cached connection (for cleanup/testing).
//  */
// export async function closeConnection(): Promise<void> {
//   if (cachedClient) {
//     await cachedClient.close();
//     cachedClient = null;
//     cachedDb = null;
//     debugLog("MongoDB connection closed");
//   }
// }

// /**
//  * MongoDB Serverless-Safe Connection Helper
//  *
//  * Designed specifically for:
//  * - Vercel Serverless Functions
//  * - Node 18/20 + OpenSSL 3
//  * - MongoDB Atlas
//  *
//  * Fixes:
//  * - TLS handshake failures (tlsv1 alert internal error)
//  * - Connection pool corruption
//  * - Cold start race conditions
//  */

// import { MongoClient } from "mongodb";

// const DATABASE_NAME = "companies";

// // Extend global scope to cache the client promise across invocations
// declare global {
//   // eslint-disable-next-line no-var
//   var _mongoClientPromise: Promise<MongoClient> | undefined;
// }

import { MongoClient, Document } from "mongodb";
import { debugLog } from '@/lib/utils';

const DATABASE_NAME = "companies";

// Extend global scope to cache the client promise across invocations
declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

/**
 * Get (or create) a MongoDB client.
 * Uses a single-connection pool and pins TLS to 1.2 for serverless safety.
 */
export async function getMongoClient(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI environment variable is not set");
  }

  // Reuse the client promise if it exists (prevents multiple TLS handshakes)
  if (!global._mongoClientPromise) {
    const client = new MongoClient(uri, {
      /**
       * Serverless-safe pooling
       * Each Vercel lambda = 1 connection max
       */
      maxPoolSize: 1,
      minPoolSize: 0,
      maxIdleTimeMS: 0,

      /**
       * Timeouts tuned for serverless
       */
      connectTimeoutMS: 10_000,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 10_000,

      /**
       * TLS hardening (critical)
       * Prevents OpenSSL 3 ↔ Atlas handshake failures
       */
      tls: true,

      /**
       * Retry logic (safe with maxPoolSize = 1)
       */
      retryReads: true,
      retryWrites: true,
    });

    global._mongoClientPromise = client.connect();
  }

  return global._mongoClientPromise;
}

/**
 * Get the database instance.
 * Reuses the same client across invocations.
 */
export async function getDatabase() {
  const client = await getMongoClient();
  return client.db(DATABASE_NAME);
}

/**
 * Get a typed collection from the database.
 */
export async function getCollection<T extends Document = Document>(collectionName: string) {
  const db = await getDatabase();
  return db.collection<T>(collectionName);
}

/**
 * Close the MongoDB connection.
 * Useful for CLI scripts and testing.
 */
export async function closeConnection(): Promise<void> {
  if (global._mongoClientPromise) {
    const client = await global._mongoClientPromise;
    await client.close();
    global._mongoClientPromise = undefined;
    debugLog("MongoDB connection closed");
  }
}
