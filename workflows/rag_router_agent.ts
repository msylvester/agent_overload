/**
 * RAG Workflow — LangGraph + OpenRouter Rewrite
 */

import { z } from "zod";
import { StateGraph, END } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { zodResponseFormat } from "openai/helpers/zod";

import { RagResearchAgent } from "./agents/rag_research_agent";

// ============================================================
// SCHEMAS
// ============================================================

const RAGSourceSchema = z.object({
  companyName: z.string(),
  investors: z.string().nullable().optional(),
  relevanceScore: z.number(),
  documentSnippet: z.string(),
});

const RAGQueryResponseSchema = z.object({
  answer: z.string(),
  sources: z.array(RAGSourceSchema),
  confidenceScore: z.number(),
  reasoning: z.string(),
});

export type RAGQueryResponse = z.infer<typeof RAGQueryResponseSchema>;

// ============================================================
// OPENROUTER LLM
// ============================================================

function llm() {
  return new ChatOpenAI({
    apiKey: process.env.OPENROUTER_API_KEY!,
    model: "gpt-4o",
    temperature: 0.3,
    configuration: { baseURL: "https://openrouter.ai/api/v1" }
  });
}

// ============================================================
// NODE 1 — Semantic Search (MongoDB Vector Index)
// ============================================================

async function semanticSearchNode(state: { query: string }) {
  const rag = new RagResearchAgent();
  await rag.connect();

  const results = await rag.testVectorSearch(state.query);

  const filtered = results
    .filter(r => r.distance <= 0.3)
    .slice(0, 5);

  const documents = filtered.map(r =>
    `Company: ${r.company_name}\nDescription: ${r.description}\nDistance: ${r.distance}`
  );

  const metadatas = filtered.map((r, idx) => ({
    companyName: r.company_name,
    investors: r.investors,
    relevanceScore: 1 - r.distance,
    documentSnippet: r.description?.slice(0, 300) ?? "",
  }));

  const distances = filtered.map(r => r.distance);

  return { documents, metadatas, distances };
}

// ============================================================
// NODE 2 — LLM Reasoning Node
// ============================================================

async function reasoningNode(state: {
  query: string;
  documents: string[];
  distances: number[];
}) {

  if (!state.documents.length) {
    return {
      answer: "No relevant documents found.",
      confidenceScore: 0,
      reasoning: "No retrieved evidence.",
    };
  }

  const docContext = state.documents
    .map((d, i) => `[Doc ${i + 1}] (distance ${state.distances[i]})\n${d}`)
    .join("\n\n");

  const prompt = `
Use the retrieved company documents to answer:

Query: ${state.query}

Documents:
${docContext}

Synthesise a complete RAG answer:
- cite companies
- discuss relevance
- produce confident reasoning
- include uncertainty if needed
`;

  const completion = await llm().invoke([
    { role: "system", content: "You are a RAG reasoning engine." },
    { role: "user", content: prompt }
  ]);

  return {
    rawAnswer: completion.content,
  };
}

// ============================================================
// NODE 3 — Format Output Node
// ============================================================

async function formatNode(state: {
  rawAnswer: string;
  metadatas: any[];
}) {

  const prompt = `
Format the following RAG reasoning into strict JSON:

Raw answer:
${state.rawAnswer}

Metadata:
${JSON.stringify(state.metadatas)}

Output MUST follow this schema:
${RAGQueryResponseSchema.toString()}
`;

  const result = await llm().invoke(
    [
      { role: "system", content: "Format the RAG response" },
      { role: "user", content: prompt },
    ],
    {
      response_format: zodResponseFormat(
        RAGQueryResponseSchema,
        "rag_output"
      ) as any,
    }
  );

  // Parse the JSON content from the LLM response
  const parsedContent = typeof result.content === 'string'
    ? JSON.parse(result.content)
    : result.content;

  return { final: parsedContent };
}

// ============================================================
// BUILD THE WORKFLOW
// ============================================================

const workflow = new StateGraph({
  channels: {
    query: "string",
    documents: z.array(z.string()),
    metadatas: z.array(RAGSourceSchema),
    distances: z.array(z.number()),
    rawAnswer: "string",
    final: RAGQueryResponseSchema,
  }
})
  .addNode("semanticSearch", semanticSearchNode)
  .addNode("reasoning", reasoningNode)
  .addNode("format", formatNode)

  .addEdge("__start__", "semanticSearch")
  .addEdge("semanticSearch", "reasoning")
  .addEdge("reasoning", "format")
  .addEdge("format", END);

const app = workflow.compile();

// ============================================================
// PUBLIC API
// ============================================================

export async function runRagQuery(query: string): Promise<RAGQueryResponse> {
  const result = await app.invoke({ query });
  return result.final;
}


