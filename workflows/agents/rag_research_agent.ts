//get the emebeding function
import { config } from 'dotenv';
import { embedSingle } from '../data_service';
import { MongoClient, Collection, ObjectId } from 'mongodb';
import * as path from 'path';

// Load environment variables from .env.local (two directories up from agents/)
config({ path: path.resolve(__dirname, '../../.env.local') });


type Embedding = {
  id: ObjectId,
  embedding: number[],
}

type CosineDistance = {
  distance: number,
  name?: string,
  similarity?: number,
}


class RagResearchAgent {
  private collection: Collection;
  private client: MongoClient;

 constructor() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('MONGODB_URI is not defined in .env.local');
    }
    this.client = new MongoClient(uri);
    this.collection = this.client.db("companies").collection("funded_companies");
  }

  async connect() {
    await this.client.connect();
    this.collection = this.client.db("companies").collection("funded_companies");
  }
  /** getEmbeddings, embed the prompt
   * @param string query
   * @return new Embedding
   **/
  async getEmbedding(query: string): Promise<Embedding> {
    let queryVector: Embedding = {} as Embedding;
    try {
      queryVector = await embedSingle(query);
    } catch(e) {
      throw new Error(`the exception is as follows ${e}`);
    }

    return queryVector;
  }

  //just try a basic vector search
  async testVectorSearch(query: string): Promise<any[]> {
    const embedding = await this.getEmbedding(query);
    const queryVector = embedding.embedding;


    try {
      const results = await this.collection
        .aggregate([
          {
            $vectorSearch: {
              index: "vector_index",
              path: "embedding",
              queryVector,
              numCandidates: 100,
              limit: 5
            }
          },
          {
            $project: {
              company_name: 1,
              description: 1,
              similarity: { $meta: "vectorSearchScore" },
              distance: {
                $subtract: [1, { $meta: "vectorSearchScore" }]
              }
            }
          }
        ])
        .toArray();

      console.log(`here are the vector search results: ${JSON.stringify(results)}`);
      return results;
    } catch(e) {
      console.error(`here is the error ${e}`);
      throw new Error(`Vector search failed: ${e}`);
    }
  }
 
  /**
   * getCosineDistance - get cosine distance threshold
   *  @param query - the search query string
   *  @return CosineDistance[]
   *
   */
  async getCosineDistance(query: string): Promise<CosineDistance[]> {
    const embedding = await this.getEmbedding(query);
    const queryVector = embedding.embedding;

    console.log(`the embedding is ${JSON.stringify(embedding)}`)

    try {
      const results = await this.collection
        .aggregate([
          {
            $vectorSearch: {
              index: "vector_index",
              path: "embedding",
              queryVector,
              numCandidates: 100,
              limit: 5
            }
          },
          {
            $project: {
              name: 1,
              similarity: { $meta: "vectorSearchScore" },
              distance: {
                $subtract: [1, { $meta: "vectorSearchScore" }]
              }
            }
          }
        ])
        .toArray();

      console.log(`here are the results ${JSON.stringify(results)}`);
      return results as CosineDistance[];
    } catch (error) {
      console.error('Error executing vector search:', error);
      throw new Error(`Vector search failed: ${error}`);
    }
  }
}

export { RagResearchAgent };
