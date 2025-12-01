/**
 * Unified Research Workflow — LangGraph Version
 * Replaces the OpenAI Agent SDK orchestration layer.
 */

import { z } from "zod";
import { StateGraph, END } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { zodResponseFormat } from "openai/helpers/zod";

import { runRagQuery, RAGQueryResponse } from "./rag_router_agent";
import { researchCompanies, WebResearchAgentOutput } from "./agents/web_search_router";
import { temporalIntent, TemporalOutput } from "./temporal_router_integration_workflow";

// ============================================================
// LLM FOR BASIC RESPONSES (OpenRouter)
// ============================================================

function llm(model: string = "gpt-4o-mini") {
  return new ChatOpenAI({
    apiKey: process.env.OPENROUTER_API_KEY!,
    model,
    temperature: 0.7,
    configuration: { baseURL: "https://openrouter.ai/api/v1" },
  });
}

// ============================================================
// SCHEMAS
// ============================================================

const RagCompanySchema = z.object({
  companyName: z.string(),
  relevanceScore: z.number(),
  documentSnippet: z.string(),
});

const WorkflowOutputSchema = z.object({
  basicResponse: z.string().optional(),
  ragResults: z
    .object({
      answer: z.string(),
      sources: z.array(RagCompanySchema),
      confidenceScore: z.number(),
      reasoning: z.string(),
    })
    .optional(),
  webResults: z
    .object({
      companies: z.array(
        z.object({
          company_name: z.string(),
          website: z.string(),
          company_size: z.string(),
          headquarters_location: z.string(),
          founded_year: z.number(),
          industry: z.string(),
          description: z.string(),
        })
      ),
    })
    .optional(),
  temporalResponse: z.any().optional(),
});

// ============================================================
// NODES
// ============================================================

// Node 1 — Basic LLM Advice
async function basicNode(state: { query: string }) {
  const response = await llm().invoke([
    {
      role: "system",
      content: "You are a helpful startup advisor. Provide concise, actionable advice.",
    },
    { role: "user", content: state.query },
  ]);

  return {
    basicResponse: response.content,
  };
}

// Node 2 — RAG Query
async function ragNode(state: { query: string }) {
  console.log("🔍 Running RAG Query...");
  const ragResults = await runRagQuery(state.query);

  return {
    ragResults,
  };
}

// Node 3 — Web Research
async function webResearchNode(state: {
  ragResults: RAGQueryResponse;
}) {
  const companyNames = state.ragResults.sources.map(s => s.companyName);

  if (companyNames.length === 0) {
    console.log("⏭️ No companies found — skipping web research");
    return {};
  }

  console.log(`🌐 Web researching: ${companyNames.join(", ")}`);

  const webResults = await researchCompanies(companyNames);

  return {
    webResults,
  };
}

// Node 4 — Temporal Workflow
async function temporalNode(state: { query: string }) {
  console.log("📅 Running temporal workflow...");
  const temporalResponse = await temporalIntent(state.query);
  return {
    temporalResponse,
  };
}

// Router Node — Decides which path to take
async function routerNode(state: { intent: string }) {
  // This node just passes the state through
  // The conditional edge will decide the next step
  return {};
}

// ============================================================
// WORKFLOW ORCHESTRATION
// ============================================================

const workflow = new StateGraph({
  channels: {
    query: "string",
    intent: "string",

    basicResponse: z.string().optional(),

    ragResults: z.any().optional(),
    webResults: z.any().optional(),

    temporalResponse: z.any().optional(),
  },
})
  .addNode("router", routerNode)
  .addNode("basic", basicNode)
  .addNode("rag", ragNode)
  .addNode("webResearch", webResearchNode)
  .addNode("temporal", temporalNode)

  // Start with router
  .addEdge("__start__", "router")

  // Conditional routing from router node
  .addConditionalEdges("router", (state) => {
    switch (state.intent) {
      case "basic":
        return "basic";
      case "research":
        return "rag";
      case "time":
        return "temporal";
      default:
        throw new Error(`Unknown intent: ${state.intent}`);
    }
  })

  // Research workflow path
  .addEdge("rag", "webResearch")

  // All paths end
  .addEdge("basic", END)
  .addEdge("temporal", END)
  .addEdge("webResearch", END);

const app = workflow.compile();

// ============================================================
// PUBLIC API
// ============================================================

export async function runResearchWorkflow(
  inputText: string,
  intent: "basic" | "research" | "time"
) {
  const result = await app.invoke({
    query: inputText,
    intent,
  });

  // Validate & return via schema
  return WorkflowOutputSchema.parse(result);
}

export type { WorkflowOutputSchema };
