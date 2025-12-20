//we want to DUMP the collection on to the hosted mongodb atlas via atlas
//

import { config } from "dotenv";
import { MongoClient, ObjectId } from "mongodb";
import OpenAI from "openai";
import * as path from "path";

// Load environment variables from .env.local
config({ path: path.resolve(__dirname, "../.env.local") });

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("MONGODB_URI is not defined in .env.local");
}

const client = new MongoClient(uri);

// Initialize OpenAI client (configured for OpenRouter)
const openaiClient = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

export async function getRecords(): Promise<any[]> {
  try {
    await client.connect();
    const db = client.db("companies");

    const collection = db.collection("funded_companies");

    const records = await collection.find({}).toArray();
    await client.close();

    return records;
  } catch (e) {
    await client.close();
    throw new Error(`Cannot get documents: ${e}`);
  }
}

/**
 * makeEmbeddings -> loop through the records and create embeddings
 * Processes all company records and generates embeddings for each
 */
async function makeEmbeddings() {
  //get records, loop through and call embed
  const records = await getRecords();
  for (const record of records) {
    //deconstruct and call embed
    const { _id: id, company_name, description } = record;
    await embed(id, company_name, description);
  }
}
type Embedding = {
  id: ObjectId;
  embedding: number[];
};

//embed_single_query takes in a query, embeds it and returns an embeddings
// @param query: string
// @returns Embedding
//
//
//
//
//
export async function embedSingle(query: string): Promise<Embedding> {
  const input = `Description: ${query}`;

  const response = await openaiClient.embeddings.create({
    model: "text-embedding-3-small",
    input,
  });

  // Extract the embedding vector from the response
  const embeddingVector = response.data[0].embedding;

  return {
    id: new ObjectId(),
    embedding: embeddingVector,
  };
}

/**
 * embed - Generate embeddings for a company record
 * @param uid - MongoDB ObjectId of the document
 * @param company_name - Name of the company
 * @param description - Description of the company
 * @returns Object containing the document ID and embedding vector
 */
export async function embed(
  uid: ObjectId,
  company_name: string,
  description: string
): Promise<Embedding> {
  try {
    // Validate inputs
    if (!company_name?.trim() || !description?.trim()) {
      throw new Error(
        "Company name and description are required and cannot be empty"
      );
    }

    // Create embedding using OpenAI
    const response = await openaiClient.embeddings.create({
      model: "text-embedding-3-small",
      input: `Company: ${company_name} Description: ${description}`,
    });

    // Extract the embedding vector from the response
    const embeddingVector = response.data[0].embedding;

    // Connect to MongoDB and update the document
    await client.connect();

    try {
      const db = client.db("companies");
      const collection = db.collection("funded_companies");

      await collection.updateOne(
        { _id: uid },
        { $set: { embedding: embeddingVector } }
      );

      return {
        id: uid,
        embedding: embeddingVector,
      };
    } finally {
      await client.close();
    }
  } catch (error) {
    console.error(`Failed to create embedding for document ${uid}:`, error);
    throw new Error(
      `Embedding creation failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

async function dumpRecords(): Promise<Record<string, any>> {
  try {
    // TODO: Implement record dumping logic
    return {};
  } catch (e) {
    throw new Error(`there is an error ${e}`);
  }
}

// Commented out to prevent auto-execution on import
// (async () => {
//   const records = await getRecords();
//   console.log(`Found ${records.length} records`);
// })();
