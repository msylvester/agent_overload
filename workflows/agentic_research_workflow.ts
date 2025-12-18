/**
 * Unified Research Workflow — LangGraph Version
 * Replaces the OpenAI Agent SDK orchestration layer.
 */

import { z } from "zod";
import { StateGraph, END } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { zodResponseFormat } from "openai/helpers/zod";

// OLD RAG - Replaced with agentic RAG (see agentic_two_rag.ts)
// import { runRagQuery, RAGQueryResponse } from "./rag_router_agent";

// NEW: Agentic RAG using LangGraph, MongoDB Atlas, and OpenRouter

import { buildGraph, invokeGraph } from "./agentic_two_rag";



// WEB RESEARCH - Commented out (not used in current workflow)
// import { researchCompanies, WebResearchAgentOutput } from "./agents/web_search_router";

import { temporalIntent } from "./temporal_router_integration_workflow";

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

// Define the workflow state interface
interface WorkflowState {
  query: string;
  intent: string;
  basicResponse?: string;
  ragResults?: string;
  temporalResponse?: any;
}

// RagCompanySchema removed - no longer needed with new agentic RAG

const WorkflowOutputSchema = z.object({
  basicResponse: z.string().optional(),

  // NEW: Simple string answer from agentic RAG
  ragResults: z.string().optional(),

  // WEB RESEARCH - Preserved but not used
  // webResults: z
  //   .object({
  //     companies: z.array(
  //       z.object({
  //         company_name: z.string(),
  //         website: z.string(),
  //         company_size: z.string(),
  //         headquarters_location: z.string(),
  //         founded_year: z.number(),
  //         industry: z.string(),
  //         description: z.string(),
  //       })
  //     ),
  //   })
  //   .optional(),

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

// Module-level graph instance (expensive to build, reuse across calls)
let ragGraph: Awaited<ReturnType<typeof buildGraph>> | null = null;

// Node 2 — RAG Query (New Agentic RAG)
async function ragNode(state: { query: string }) {
  console.log("🔍 Running Agentic RAG Query...");

  // Build graph on first use (lazy initialization)
  if (!ragGraph) {
    console.log("📊 Building RAG graph (first run)...");
    ragGraph = await buildGraph();
  }

  // Invoke the new agentic RAG workflow
  let ragResults = await invokeGraph(state.query, ragGraph);
  ragResults = ragResults + "\n\n**Dragon**";

  return {
    ragResults, // Now a string instead of structured object
  };
}

// ============================================================
// WEB RESEARCH NODE - DISABLED
// This node has been disabled as we're now using the agentic RAG
// which provides comprehensive answers without requiring additional
// web research. Code is preserved for potential future use.
// ============================================================

/*
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
*/

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

const workflow = new StateGraph<WorkflowState>({
  channels: {
    query: {
      value: (left?: string, right?: string) => right ?? left ?? "",
      default: () => "",
    },
    intent: {
      value: (left?: string, right?: string) => right ?? left ?? "",
      default: () => "",
    },
    basicResponse: {
      value: (left?: string, right?: string) => right ?? left,
      default: () => undefined,
    },
    ragResults: {
      value: (left?: string, right?: string) => right ?? left,
      default: () => undefined,
    },
    temporalResponse: {
      value: (left?: any, right?: any) => right ?? left,
      default: () => undefined,
    },
  },
})
  .addNode("router", routerNode)
  .addNode("basic", basicNode)
  .addNode("rag", ragNode)
  // .addNode("webResearch", webResearchNode)  // DISABLED
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

  // Research workflow path - now goes directly to END
  .addEdge("rag", END)  // Changed from "webResearch"

  // All paths end
  .addEdge("basic", END)
  .addEdge("temporal", END);
  // .addEdge("webResearch", END);  // DISABLED

const app = workflow.compile();

// ============================================================
// PUBLIC API
// ============================================================

export { app };

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
