
/**
 * Agentic RAG with MongoDB Atlas, LangGraph and OpenRouter
 *
 * This implementation creates a retrieval agent that:
 * - Searches company records from MongoDB Atlas
 * - Uses pre-computed vector embeddings (OpenAI-small on 'description' field)
 * - Supports filtering by company_name or searching all companies
 * - Uses OpenRouter for BOTH chat models and embeddings
 * - Decides whether to retrieve documents
 * - Grades document relevance
 * - Optionally rewrites queries (single pass, no infinite loops)
 * - Generates answers from relevant documents
 *
 * Environment variables required:
 * - OPENROUTER_API_KEY : For all LLM calls and query embeddings via OpenRouter
 * - MONGODB_URI        : MongoDB Atlas connection string
 *
 * Optional (for OpenRouter analytics / leaderboard):
 * - OPENROUTER_SITE_URL
 * - OPENROUTER_SITE_NAME
 */

import { ChatOpenAI } from "@langchain/openai";
import { MongoClient } from "mongodb";
import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";
import { createRetrieverTool } from "@langchain/core/tools";
import { StateGraph, END, START } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import {
  BaseMessage,
  HumanMessage,
  AIMessage,
  ToolMessage,
} from "@langchain/core/messages";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { z } from "zod";
import type { RunnableConfig } from "@langchain/core/runnables";
import { Embeddings } from "@langchain/core/embeddings";

// ============================================================================
// CONFIGURATION
// ============================================================================

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

// Optional attribution (for OpenRouter leaderboards/analytics)
const OPENROUTER_SITE_URL =
  process.env.OPENROUTER_SITE_URL || "https://localhost";
const OPENROUTER_SITE_NAME =
  process.env.OPENROUTER_SITE_NAME || "Company RAG System";

// Model names (must be valid OpenRouter model IDs)
const AGENT_MODEL = "anthropic/claude-sonnet-4"; // For agent decisions
const GRADER_MODEL = "anthropic/claude-sonnet-4"; // For grading documents
const REWRITE_MODEL = "openai/gpt-4.1-mini"; // For query rewriting
const GENERATION_MODEL = "openai/gpt-4.1-mini"; // For final answer generation

// MongoDB Configuration
const MONGODB_URI = process.env.MONGODB_URI || "";
const MONGODB_DB_NAME = "companies";
const MONGODB_COLLECTION_NAME = "funded_companies";
const MONGODB_INDEX_NAME = "vector_index";
const MONGODB_VECTOR_FIELD = "embedding";
const MONGODB_TEXT_FIELD = "description";

// Embeddings via OpenRouter (OpenAI-compatible embedding model on OpenRouter)
const EMBEDDING_MODEL = "openai/text-embedding-3-small";

// Company filtering configuration (null = search all companies)
const FILTER_COMPANY_NAME: string | null = null;

// ============================================================================
// STATE DEFINITION
// ============================================================================

export interface AgentState {
  messages: BaseMessage[];
}

// State channels define how state updates are merged
const graphState = {
  messages: {
    value: (left: BaseMessage[], right: BaseMessage[]) => left.concat(right),
    default: () => [],
  },
};

// ============================================================================
// OPENROUTER CLIENT HELPERS
// ============================================================================

/**
 * Chat client using OpenRouter via the OpenAI-compatible Chat API.
 * Uses @langchain/openai's ChatOpenAI, but points it at OpenRouter.
 */
function createOpenRouterClient(model: string, temperature = 0) {
  if (!OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY environment variable is not set");
  }

  return new ChatOpenAI(
    {
      model,
      temperature,
      apiKey: OPENROUTER_API_KEY,
    },
    {
      baseURL: OPENROUTER_BASE_URL,
      defaultHeaders: {
        "HTTP-Referer": OPENROUTER_SITE_URL,
        "X-Title": OPENROUTER_SITE_NAME,
      },
    }
  );
}

/**
 * Custom Embeddings implementation using OpenRouter's Embeddings API.
 *
 * Docs: https://openrouter.ai/docs/api/reference/embeddings
 */
class OpenRouterEmbeddings extends Embeddings {
  private model: string;
  private baseURL: string;
  private apiKey: string;

  constructor(model: string) {
    super();
    this.model = model;
    this.baseURL = `${OPENROUTER_BASE_URL}/embeddings`;
    this.apiKey = OPENROUTER_API_KEY;

    if (!this.apiKey) {
      throw new Error("OPENROUTER_API_KEY environment variable is not set");
    }
  }

  private async embedInternal(
    input: string | string[]
  ): Promise<number[][]> {
    const isSingle = typeof input === "string";
    const payload = {
      model: this.model,
      input: isSingle ? [input] : input,
    };

    const res = await fetch(this.baseURL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": OPENROUTER_SITE_URL,
        "X-Title": OPENROUTER_SITE_NAME,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(
        `OpenRouter embeddings error (${res.status}): ${
          text || res.statusText
        }`
      );
    }

    const json: any = await res.json();
    if (!json.data || !Array.isArray(json.data)) {
      throw new Error(
        `Unexpected embeddings response from OpenRouter: ${JSON.stringify(
          json
        ).slice(0, 400)}`
      );
    }

    return json.data.map((item: any) => item.embedding as number[]);
  }

  async embedDocuments(texts: string[]): Promise<number[][]> {
    if (!texts.length) return [];
    return this.embedInternal(texts);
  }

  async embedQuery(text: string): Promise<number[]> {
    const [embedding] = await this.embedInternal(text);
    return embedding;
  }
}

// ============================================================================
// MONGODB CONNECTION
// ============================================================================

async function connectToMongoDB() {
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI environment variable is not set");
  }

  console.log("[INFO] Connecting to MongoDB Atlas...");

  const client = new MongoClient(MONGODB_URI);
  await client.connect();

  console.log("[SUCCESS] Connected to MongoDB Atlas");

  const db = client.db(MONGODB_DB_NAME);
  const collection = db.collection(MONGODB_COLLECTION_NAME);

  return { client, collection };
}

// ============================================================================
// SETUP RETRIEVER (MongoDB Atlas Vector Search + OpenRouter Embeddings)
// ============================================================================

async function setupRetriever() {
  console.log("[INFO] Setting up MongoDB Atlas Vector Search...");

  // Connect to MongoDB
  const { collection } = await connectToMongoDB();

  // Initialize OpenRouter embeddings (for query embedding only - docs already embedded)
  const embeddings = new OpenRouterEmbeddings(EMBEDDING_MODEL);

  console.log("[INFO] Checking company documents in collection...");

  // Count total companies
  const totalCount = await collection.countDocuments({});
  console.log(`[INFO] Total documents in collection: ${totalCount}`);

  // If filtering by company, show count
  if (FILTER_COMPANY_NAME) {
    const companyCount = await collection.countDocuments({
      company_name: FILTER_COMPANY_NAME
    });
    console.log(`[INFO] Documents for '${FILTER_COMPANY_NAME}': ${companyCount}`);
  }

  // Create vector store instance for retrieval
  const vectorStoreInstance = new MongoDBAtlasVectorSearch(embeddings, {
    collection,
    indexName: MONGODB_INDEX_NAME,
    textKey: MONGODB_TEXT_FIELD,
    embeddingKey: MONGODB_VECTOR_FIELD,
  });

  // Create retriever with optional company filter
  const retrieverConfig: any = {
    k: 20,  // Retrieve top 20 for filtering
  };

  if (FILTER_COMPANY_NAME) {
    retrieverConfig.filter = {
      preFilter: {
        company_name: FILTER_COMPANY_NAME,
      },
    };
  }

  const retriever = vectorStoreInstance.asRetriever(retrieverConfig);

  return { retriever, vectorStore: vectorStoreInstance };
}

// ============================================================================
// NODES
// ============================================================================

let tools: any[] = [];
let retrieverTool: any;
let vectorStore: MongoDBAtlasVectorSearch;

/**
 * Retrieve node: Fetches documents from vector store with similarity scores
 */
async function retrieveNode(state: AgentState, _config?: RunnableConfig) {
  console.log("[RETRIEVE] Fetching documents from vector store...");

  // Extract query from agent's tool call
  const messages = state.messages;
  const lastMessage = messages[messages.length - 1] as AIMessage;
  const toolCall = (lastMessage as any).tool_calls?.[0];

  if (!toolCall) {
    return { messages: [] };
  }

  const query = toolCall.args.query;

  // Build filter object
  const filter: any = {};
  if (FILTER_COMPANY_NAME) {
    filter.company_name = FILTER_COMPANY_NAME;
  }

  // Retrieve documents (embeddings already exist - no need to embed on retrieval)
  const allDocsWithScores = await vectorStore.similaritySearchWithScore(
    query,
    20,
    Object.keys(filter).length > 0 ? filter : undefined
  );

  // Post-filter to exclude generic/irrelevant documents (e.g., "Get In Touch")
  // Take top 4 after filtering
  const docsWithScores = allDocsWithScores
    .filter(([doc]) => {
      // Exclude generic contact pages or placeholder content
      const title = doc.metadata.title || "";
      return !title.toLowerCase().includes("get in touch") &&
             !title.toLowerCase().includes("contact us");
    })
    .slice(0, 4);

  // Log retrieved documents with scores
  console.log("\n[RETRIEVED] Documents with similarity scores:");
  docsWithScores.forEach((docWithScore, index) => {
    const [doc, score] = docWithScore;
    console.log(`\n  Document ${index + 1}:`);
    console.log(`    Score: ${score.toFixed(4)}`);
    console.log(`    Company: ${doc.metadata.company_name || "N/A"}`);
    console.log(`    Title: ${doc.metadata.title || "N/A"}`);
    console.log(`    Source: ${doc.metadata.source || "N/A"}`);
    console.log(`    Sector: ${doc.metadata.sector || "N/A"}`);
    console.log(`    Content Preview: ${doc.pageContent.substring(0, 150)}...`);
  });
  console.log("");

  // Format documents as string WITH metadata (especially company_name!)
  const docs = docsWithScores.map(([doc]) => doc);
  const formattedDocs = docs
    .map((doc) => {
      const { companyName = "Untitled Company",
        title= "", 
        sector = "", 
        source = "", 
        funding = "" 
      } = doc.metadata || {};  
         
        /*
      const companyName = doc.metadata.company_name || "Unknown Company";
      const title = doc.metadata.title || "";
      const sector = doc.metadata.sector || "";
      const source = doc.metadata.source || "";
      const funding = doc.metadata.
*/
      return `Company: ${companyName}
${title ? `Title: ${title}` : ""}
${sector ? `Sector: ${sector}` : ""}
${source ? `Source: ${source}` : ""}
${funding ? `Funding: ${funding}` : ""}

Content: ${doc.pageContent}
`;
    })
    .join("\n---\n\n");

  // Return ToolMessage
  return {
    messages: [
      new ToolMessage({
        name: "retrieve_company_info",
        content: formattedDocs,
        tool_call_id: toolCall.id,
      }),
    ],
  };
}

/**
 * Agent node: Decides whether to retrieve documents or end
 */
async function agentNode(state: AgentState, _config?: RunnableConfig) {
  console.log("[AGENT] Calling agent...");

  const messages = state.messages;

  // Log the original query
  if (messages.length > 0) {
    console.log("[QUERY] Processing query:", messages[0].content);
  }

  const model = createOpenRouterClient(AGENT_MODEL);

  // Bind tools to the model
  const modelWithTools = model.bindTools(tools);
  const response = await modelWithTools.invoke(messages);

  return { messages: [response] };
}

/**
 * Rewrite node: Transforms the query to improve retrieval
 * (Single-pass; after rewrite we go directly to generate to avoid loops.)
 */
async function rewriteNode(state: AgentState, _config?: RunnableConfig) {
  console.log("[REWRITE] Transforming query...");

  const messages = state.messages;
  const question = messages[0].content;

  console.log("[REWRITE] Original query:", question);

  const msg = new HumanMessage({
    content: `You are optimizing a search query for a vector database of company profiles and descriptions.

Original user question:
-------
${question}
-------

Rewrite this as a single, explicit search query that:
- Focuses on key business concepts, technologies, or sectors
- Includes relevant industry terms when appropriate
- Is specific enough to match company descriptions
- Is short and to the point

Return ONLY the rewritten query text, nothing else.`,
  });

  const model = createOpenRouterClient(REWRITE_MODEL);
  const response = await model.invoke([msg]);

  console.log("[REWRITE] Rewritten query:", response.content);

  return { messages: [response] };
}

/**
 * Generate node: Creates final answer from relevant documents
 */
async function generateNode(state: AgentState, _config?: RunnableConfig) {
  console.log("[GENERATE] Creating answer...");

  const messages = state.messages;
  const question = messages[0].content;
  const lastMessage = messages[messages.length - 1];

  const docs = (lastMessage as any).content;

  // RAG prompt template
  const prompt = PromptTemplate.fromTemplate(
    `You are an assistant for question-answering tasks about companies and their businesses.

Use the following pieces of retrieved context (company descriptions, sector information, funding details, etc.) to answer the question.
If you don't know the answer from the context, say you don't know.
Prefer bullet points when listing multiple companies.
When available, include relevant funding information for each company.
Use at most four sentences unless the user explicitly asks for more detail.

Question: {question}
Context: {context}
Answer:`
  );

  const llm = createOpenRouterClient(GENERATION_MODEL);

  // Create chain
  const ragChain = prompt.pipe(llm).pipe(new StringOutputParser());

  // Generate response
  const response = await ragChain.invoke({
    context: docs,
    question: question,
  });

  return { messages: [new AIMessage(response)] };
}

// ============================================================================
// EDGES (CONDITIONAL ROUTING)
// ============================================================================

/**
 * Grade documents for relevance.
 *
 * IMPORTANT: To avoid infinite loops / recursion, this function:
 * - Returns "generate" when docs are relevant
 * - Returns "rewrite" once when docs are not clearly relevant
 *   (the graph routes rewrite -> generate, so no cycles)
 */
async function gradeDocuments(
  state: AgentState
): Promise<"generate" | "rewrite"> {
  console.log("[GRADE] Checking document relevance...");

  // Define grading schema
  const gradeSchema = z.object({
    binaryScore: z.enum(["yes", "no"]).describe("Relevance score 'yes' or 'no'"),
  });

  const model = createOpenRouterClient(GRADER_MODEL);
  const llmWithStructuredOutput = model.withStructuredOutput(gradeSchema);

  const prompt = PromptTemplate.fromTemplate(
    `You are a grader assessing relevance of retrieved company information to a user question.

Here is the retrieved document(s):
{context}

Here is the user question:
{question}

If the document contains keyword(s) or semantic meaning related to the user question, grade it as relevant.
Give a binary score 'yes' or 'no' to indicate whether the document is relevant to the question.`
  );

  const chain = prompt.pipe(llmWithStructuredOutput);

  const messages = state.messages;
  const lastMessage = messages[messages.length - 1];
  const question = messages[0].content;
  const docs = (lastMessage as any).content ?? "";

  // Log what was retrieved
  console.log("\n[RETRIEVED] Documents retrieved from vector search:");
  if (typeof docs === "string") {
    // Truncate for readability but show key info
    const preview = docs.length > 500 ? docs.substring(0, 500) + "..." : docs;
    console.log(preview);
    console.log(`[RETRIEVED] Total length: ${docs.length} characters`);
  } else {
    console.log(JSON.stringify(docs, null, 2).substring(0, 500));
  }
  console.log("");

  // If somehow docs are empty/undefined, avoid loops by just generating
  if (!docs || (typeof docs === "string" && docs.trim().length === 0)) {
    console.log(
      "[GRADE] No documents retrieved (empty context) → forcing GENERATE"
    );
    return "generate";
  }

  const scoredResult = await chain.invoke({
    question,
    context: docs,
  });

  const score = scoredResult.binaryScore;

  if (score === "yes") {
    console.log("[GRADE] Documents marked as: RELEVANT");
    console.log("[DECISION] → GENERATE");
    return "generate";
  } else {
    console.log("[GRADE] Documents marked as: NOT RELEVANT");
    console.log("[DECISION] → REWRITE (single pass)");
    return "rewrite";
  }
}

/**
 * Route after agent decision
 */
function routeAfterAgent(state: AgentState): string {
  const messages = state.messages;
  const lastMessage = messages[messages.length - 1] as AIMessage;

  // If there are tool calls, go to tools
  if ((lastMessage as any).tool_calls && (lastMessage as any).tool_calls.length > 0) {
    return "tools";
  }

  // Otherwise end
  return END;
}

// ============================================================================
// GRAPH CONSTRUCTION
// ============================================================================

export async function buildGraph() {
  // Setup retriever (MongoDB + OpenRouter embeddings)
  const { retriever, vectorStore: vs } = await setupRetriever();
  vectorStore = vs;

  // Create retriever tool
  retrieverTool = createRetrieverTool(retriever, {
    name: "retrieve_company_info",
    description:
      "Search and return information about companies in the database. " +
      "Use this to find company descriptions, sectors, funding information, " +
      "technology details, and business focus areas. Returns relevant company profiles based on the query.",
  });

  tools = [retrieverTool];

  // Create the graph
  const workflow = new StateGraph<AgentState>({ channels: graphState });

  // Add nodes
  workflow.addNode("agent", agentNode);
  workflow.addNode("retrieve", retrieveNode);
  workflow.addNode("rewrite", rewriteNode);
  workflow.addNode("generate", generateNode);

  // Add edges
  workflow.addEdge(START, "agent");

  // Conditional edge from agent
  workflow.addConditionalEdges("agent", routeAfterAgent, {
    tools: "retrieve",
    [END]: END,
  });

  // Conditional edge from retrieve:
  // - "generate" → generate answer
  // - "rewrite"  → rewrite then generate (no loop back to agent)
  workflow.addConditionalEdges("retrieve", gradeDocuments, {
    generate: "generate",
    rewrite: "rewrite",
  });

  // After generation, end
  workflow.addEdge("generate", END);

  // After rewrite, go directly to generate
  workflow.addEdge("rewrite", "generate");

  // Compile the graph
  return workflow.compile();
}

// ============================================================================
// HELPER FUNCTION FOR EXTERNAL INVOCATION
// ============================================================================

/**
 * Invokes the graph with a query and returns the final answer as a string.
 * Used by evaluation scripts and other consumers of this module.
 */
export async function invokeGraph(
  query: string,
  graph: Awaited<ReturnType<typeof buildGraph>>
): Promise<string> {
  const inputs = {
    messages: [new HumanMessage(query)],
  };

  // Invoke the graph (non-streaming)
  const result = await graph.invoke(inputs);

  // Extract the final answer from the last message
  const messages = result.messages;
  if (!messages || messages.length === 0) {
    return "No answer generated";
  }

  const lastMessage = messages[messages.length - 1];

  // Handle different message types
  if (typeof lastMessage === "string") {
    return lastMessage;
  } else if (lastMessage.content) {
    return typeof lastMessage.content === "string"
      ? lastMessage.content
      : JSON.stringify(lastMessage.content);
  }

  return "Unable to extract answer from response";
}

// ============================================================================
// MAIN EXECUTION (manual test harness)
// ============================================================================

async function main() {
  console.log(
    "\n=== Starting Agentic RAG System with MongoDB Atlas & OpenRouter ===\n"
  );

  if (!OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY environment variable is not set");
  }
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI environment variable is not set");
  }

  // Build the graph
  const graph = await buildGraph();

  console.log("\n" + "=".repeat(60));
  console.log("Graph compiled successfully!");
  console.log("=".repeat(60) + "\n");

  // Test query
  const inputs = {
    messages: [
      new HumanMessage("What companies are working on AI infrastructure?"),
    ],
  };

  console.log("Question:", inputs.messages[0].content);
  console.log("\n" + "-".repeat(60) + "\n");

  // Stream the graph execution
  for await (const output of await graph.stream(inputs)) {
    for (const [key, value] of Object.entries(output)) {
      console.log(`\n[OUTPUT from '${key}']`);
      console.log("-".repeat(60));

      if (value && typeof value === "object" && "messages" in value) {
        const messages = (value as any).messages;
        for (const message of messages) {
          if (typeof message === "string") {
            console.log("Answer:", message);
          } else if (message.content) {
            const content =
              typeof message.content === "string"
                ? message.content
                : JSON.stringify(message.content);

            // Truncate long content for readability
            if (content.length > 600) {
              console.log("Content:", content.substring(0, 600) + "...");
            } else {
              console.log("Content:", content);
            }
          }
        }
      }
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("Execution completed!");
  console.log("=".repeat(60));
}

// NOTE: This will always run when you do `npx tsx ./agentic_two_rag.ts`.
// If you import { buildGraph } elsewhere (e.g. in tests), main() will also run.
// If you want to avoid that, remove the next block and run main() from a separate file.

// Commented out to prevent automatic execution when imported by agentic_eval.ts
// Uncomment if you want to run this file standalone
// main().catch((error) => {
//   console.error("ERROR:", error);
//   process.exit(1);
// });

