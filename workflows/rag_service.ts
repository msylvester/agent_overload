/**
 * RAG Service Agent - Function Tool Implementation
 *
 * This module provides a RAG (Retrieval Augmented Generation) agent that can be used
 * as tools within other OpenAI Agents SDK workflows.
 */

import { Agent, run, tool } from "@openai/agents";
import { z } from "zod";
import { RagResearchAgent } from "./agents/rag_research_agent";
import OpenAI from "openai";
import { config } from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
config({ path: path.resolve(__dirname, '../.env.local') });

// ===============================
// GLOBAL RAG AGENT INSTANCE
// ===============================

// Lazy initialization to avoid loading MongoDB on import
let _ragAgentInstance: RagResearchAgent | null = null;
let _openaiClient: OpenAI | null = null;


function getRagAgent(): RagResearchAgent {
  if (_ragAgentInstance === null) {
    _ragAgentInstance = new RagResearchAgent();
  }
  return _ragAgentInstance;
}

function getOpenAIClient(): OpenAI {
  if (_openaiClient === null) {
    _openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return _openaiClient;
}

export function resetRagAgent(): void {
  _ragAgentInstance = null;
  console.log("🔄 RagAgent singleton reset - will reinitialize on next access");
}

// ===============================
// SCHEMAS
// ===============================

const RAGSourceSchema = z.object({
  companyName: z.string(),
  relevanceScore: z.number(),
  documentSnippet: z.string(),
});

const RAGQueryResponseSchema = z.object({
  answer: z.string(),
  sources: z.array(RAGSourceSchema),
  confidenceScore: z.number(),
  reasoning: z.string(),
});

export type RAGSource = z.infer<typeof RAGSourceSchema>;
export type RAGQueryResponse = z.infer<typeof RAGQueryResponseSchema>;

// ===============================
// FUNCTION TOOLS
// ===============================

interface SemanticSearchResult {
  documents: string[];
  metadatas: Array<{ company_name: string; company_index: number; _id?: string }>;
  distances: number[];
  count: number;
}

/**
 * Search the MongoDB vector store for documents relevant to the query.
 *
 * This tool performs semantic similarity search using OpenAI embeddings
 * to find the most relevant company documents based on the query.
 *
 * @param query - The search query (e.g., "fintech startups in Saudi Arabia")
 * @param topK - Maximum number of results to return (default: 5)
 * @param distanceThreshold - Maximum distance for relevance filtering (default: 0.3, range 0.0-1.0)
 * @returns Dictionary containing documents, metadatas, distances, and count
 */
export async function ragSemanticSearch(
  query: string,
  topK: number = 5,
  distanceThreshold: number = 0.3
): Promise<SemanticSearchResult> {
  const ragAgent = getRagAgent();
  await ragAgent.connect();

  try {
    const results = await ragAgent.testVectorSearch(query);

    // Filter by distance threshold and limit to topK
    const filteredResults = results
      .filter(r => r.distance <= distanceThreshold)
      .slice(0, topK);

    return {
      documents: filteredResults.map(r =>
        `Company: ${r.company_name}\nDescription: ${r.description}\nSimilarity: ${r.similarity?.toFixed(3)}\nDistance: ${r.distance?.toFixed(3)}`
      ),
      metadatas: filteredResults.map((r, idx) => ({
        company_name: r.company_name || "Unknown",
        company_index: idx,
        _id: r._id,
        description: r.description || "",
      })),
      distances: filteredResults.map(r => r.distance || 1.0),
      count: filteredResults.length,
    };
  } catch (error) {
    console.error("Error in ragSemanticSearch:", error);
    return {
      documents: [],
      metadatas: [],
      distances: [],
      count: 0,
    };
  }
}

/**
 * Generate a reasoned response using the RAG agent based on retrieved documents.
 *
 * This tool takes the retrieved documents and uses an LLM to generate
 * a comprehensive, reasoned answer that synthesizes the information.
 *
 * @param query - The original user query
 * @param documents - List of document texts from ragSemanticSearch
 * @param metadatasJson - JSON string of metadata list from ragSemanticSearch
 * @param distances - List of distance scores from ragSemanticSearch
 * @returns A reasoned response string that answers the query based on the documents
 */
export async function ragGenerateReasoning(
  query: string,
  documents: string[],
  metadatasJson: string,
  distances: number[]
): Promise<string> {
  if (!documents || documents.length === 0) {
    return "No relevant documents were found for this query. Please try a different search term.";
  }

  const metadatas = JSON.parse(metadatasJson);
  const openai = getOpenAIClient();

  // Build context from documents
  const context = documents
    .map((doc, idx) => {
      const meta = metadatas[idx] || {};
      const distance = distances[idx] || 1.0;
      return `[Document ${idx + 1}] (Distance: ${distance.toFixed(3)})\n${doc}`;
    })
    .join("\n\n");

  const prompt = `Based on the following retrieved documents, provide a comprehensive answer to the user's query.

Query: ${query}

Retrieved Documents:
${context}

Please synthesize the information from these documents to answer the query. Be specific about which companies or documents support your answer.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a helpful research assistant that synthesizes information from retrieved documents to answer user queries accurately and comprehensively.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
    });

    return completion.choices[0]?.message?.content || "Unable to generate a response.";
  } catch (error) {
    console.error("Error in ragGenerateReasoning:", error);
    return `Error generating reasoning: ${error instanceof Error ? error.message : String(error)}`;
  }
}

/**
 * Perform a complete RAG query: search + generate reasoned response.
 *
 * This is a convenience tool that combines semantic search and reasoning
 * generation into a single call.
 *
 * @param query - The search query to answer
 * @param topK - Maximum number of documents to retrieve (default: 5)
 * @returns Dictionary containing answer, sources, and document_count
 */
export async function ragFullQuery(
  query: string,
  topK: number = 5
): Promise<{ answer: string; sources: string[]; documentCount: number }> {
  const searchResults = await ragSemanticSearch(query, topK);
  const { documents, metadatas, distances, count } = searchResults;

  if (count === 0) {
    return {
      answer: "No relevant documents found for your query.",
      sources: [],
      documentCount: 0,
    };
  }

  const answer = await ragGenerateReasoning(
    query,
    documents,
    JSON.stringify(metadatas),
    distances
  );

  const sources = metadatas.map(meta => meta.company_name);

  return {
    answer,
    sources,
    documentCount: count,
  };
}

// ===============================
// TOOL DEFINITIONS
// ===============================

const ragSemanticSearchTool = tool({
  name: "ragSemanticSearch",
  description: "Search the vector store for documents relevant to the query using semantic similarity",
  parameters: z.object({
    query: z.string().describe("The search query"),
    topK: z.number().optional().default(5).describe("Maximum number of results to return"),
    distanceThreshold: z.number().optional().default(0.3).describe("Maximum distance for relevance filtering"),
  }),
  execute: async (input) => {
    const result = await ragSemanticSearch(
      input.query,
      input.topK ?? 5,
      input.distanceThreshold ?? 0.3
    );
    return JSON.stringify(result);
  },
});

const ragGenerateReasoningTool = tool({
  name: "ragGenerateReasoning",
  description: "Generate a reasoned response based on retrieved documents",
  parameters: z.object({
    query: z.string().describe("The original user query"),
    documents: z.array(z.string()).describe("List of document texts"),
    metadatasJson: z.string().describe("JSON string of metadata list"),
    distances: z.array(z.number()).describe("List of distance scores"),
  }),
  execute: async (input) => {
    return await ragGenerateReasoning(
      input.query,
      input.documents,
      input.metadatasJson,
      input.distances
    );
  },
});

const ragFullQueryTool = tool({
  name: "ragFullQuery",
  description: "Perform complete RAG query: search + reasoning",
  parameters: z.object({
    query: z.string().describe("The search query"),
    topK: z.number().optional().default(5).describe("Max documents to retrieve"),
  }),
  execute: async (input) => {
    const result = await ragFullQuery(input.query, input.topK ?? 5);
    return JSON.stringify(result);
  },
});

// ===============================
// RAG QUERY AGENT
// ===============================

const ragQueryAgent = new Agent({
  name: "RAG Query Agent",
  instructions: `
You are a RAG (Retrieval Augmented Generation) research assistant with access to a knowledge base
of funded startup companies.

Your workflow:
1. When given a query, use ragSemanticSearch to find relevant documents
2. Analyze the retrieved documents and their relevance scores (distances)
3. Use ragGenerateReasoning to synthesize a comprehensive answer
4. Provide your final response with sources and confidence assessment

Guidelines:
- Always cite which companies/documents informed your answer
- Be honest about the relevance and coverage of the retrieved information
- If no relevant documents are found, say so clearly
- Lower distance scores indicate higher relevance (< 0.3 is very relevant, > 0.5 is loosely relevant)
- Provide a confidence score (0.0-1.0) based on:
  - Number of relevant documents found
  - Distance scores (relevance)
  - How well the documents address the query

Output format:
- answer: Your synthesized response to the query
- sources: List of {companyName, relevanceScore, documentSnippet}
- confidenceScore: 0.0-1.0 based on evidence quality
- reasoning: Brief explanation of how you arrived at the answer
`,
  model: "gpt-4o",
  outputType: RAGQueryResponseSchema,
  tools: [ragSemanticSearchTool, ragGenerateReasoningTool],
});

// ===============================
// WORKFLOW FUNCTIONS
// ===============================

/**
 * Run a RAG query using the agent to retrieve and reason over documents.
 *
 * @param question - The user's question to answer using RAG
 * @returns Dictionary containing answer, sources, confidence_score, and reasoning
 */
export async function runRagQuery(question: string): Promise<RAGQueryResponse> {
  const result = await run(ragQueryAgent, question);

  if (!result.finalOutput) {
    throw new Error("RAG query failed: no output received");
  }

  return {
    answer: result.finalOutput.answer,
    sources: result.finalOutput.sources.map(source => {
      console.log('Document:', JSON.stringify(source, null, 2));
      return ({
      companyName: source.companyName,
      relevanceScore: source.relevanceScore,
      documentSnippet: source.documentSnippet,
    })
    }),
    confidenceScore: result.finalOutput.confidenceScore,
    reasoning: result.finalOutput.reasoning,
  };
}

// ===============================
// EXPORT TOOLS FOR OTHER AGENTS
// ===============================

/**
 * Get the RAG function tools for use in other agents.
 *
 * @returns Array of function tool definitions that can be passed to an Agent's tools parameter
 *
 * @example
 * import { getRagTools } from './rag_service';
 *
 * const myAgent = new Agent({
 *   name: "My Agent",
 *   tools: getRagTools(),
 *   // ...
 * });
 */
export function getRagTools() {
  return [ragSemanticSearchTool, ragGenerateReasoningTool, ragFullQueryTool];
}

// ===============================
// STANDALONE TESTING
// ===============================

if (require.main === module) {
  console.log("Testing RAG Service Agent...");
  console.log("=".repeat(50));

  const testQueries = [
    "data storage infastrucutre comanies", // should at least select Vast Data
    "biotech AI drug discovery startups", // should at least select tahoe therapeutics
    "ai sleep", // should at least select uno platform
    "dev tools",
  ];

  (async () => {
    for (const query of testQueries) {
      console.log(`\nQuery: ${query}`);
      console.log("-".repeat(50));

      try {
        const result = await runRagQuery(query);
        console.log(`Answer: ${result.answer.substring(0, 200)}...`);
        console.log(`Confidence: ${result.confidenceScore}`);
        console.log(`Sources: ${result.sources.length} documents`);
        result.sources.slice(0, 3).forEach(source => {
          console.log(`  - ${source.companyName} (relevance: ${source.relevanceScore.toFixed(2)})`);
        });
      } catch (error) {
        console.error(`Error: ${error}`);
      }

      console.log("=".repeat(50));
    }
  })();
}
