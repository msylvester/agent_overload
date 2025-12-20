import { config } from "dotenv";
import { MongoClient } from "mongodb";
import * as path from "path";

// Load environment variables from .env.local (two directories up from agents/)
config({ path: path.resolve(__dirname, "../../.env.local") });

// Validate MongoDB URI is available
const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error("MONGODB_URI is not defined in .env.local");
}
const mongoUri: string = uri;

async function runVectorSearch(queryVector: number[]) {
  const client = new MongoClient(mongoUri);

  try {
    await client.connect();

    const db = client.db("companies");
    const collection = db.collection("funded_companies");

    const pipeline = [
      {
        $vectorSearch: {
          index: "vector_index", // <-- name of your Atlas Vector Search index
          path: "embedding", // <-- your embedding field
          queryVector,
          numCandidates: 100, // tunable
          limit: 5, // top 5 results
        },
      },
      {
        $project: {
          title: 1,
          company_name: 1,
          funding_amount: 1,
          valuation: 1,
          source: 1,
          similarity: { $meta: "vectorSearchScore" },
          distance: {
            $subtract: [1, { $meta: "vectorSearchScore" }],
          },
        },
      },
    ];

    const results = await collection.aggregate(pipeline).toArray();
    console.log(results);
    return results;
  } finally {
    await client.close();
  }
}

// Example usage (queryVector must be 1536 floats)
runVectorSearch(new Array(1536).fill(0.1));
