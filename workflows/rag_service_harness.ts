/**
 * RAG Service Test Harness
 *
 * Standalone test runner for the RAG service agent.
 * Run with: pnpm tsx workflows/rag_service_harness.ts
 */

import { buildGraph, invokeGraph } from "../web_yt_vid/agentic_two_rag.js";
// If you actually need these, you can use them; otherwise remove.
// import type { AgentState } from "./agentic_two_rag.js";
// import type { CompiledStateGraph } from "@langchain/langgraph";
// import { HumanMessage } from "@langchain/core/messages";

interface TestCase {
  query: string;
  expectedKeywords: string[];
  description: string;
}

interface RagResultSource {
  companyName: string;
  relevanceScore: number;
}

interface RagResult {
  answer: string;
  confidenceScore: number;
  sources: RagResultSource[];
}

console.log("Testing RAG Service Agent...");
console.log("=".repeat(50));

console.log("Testing RAG Service Agent...");
console.log("=".repeat(50));

const TEST_CASES: TestCase[] = [
  {
    query: "data storage infastrucutre comanies",
    expectedKeywords: ["Vast Data"],
    description: "Should find all the companies that do data storage"
  },
  {
    query: "whats going on with energy innvoation",
    expectedKeywords: ["General", "Exo", "Fusion", "Commonwealth"],
    description: "Should find all the companies that do energy and make mention of fusion"
  },
  {
    query: "who are some dev tool companies",
    expectedKeywords: ["Emergent", "Cursor", "No Code"],
    description: "Should discuss the no code platforms"
  }
];

(async () => {
  // Build once
  const graph = await buildGraph();

  for (const test of TEST_CASES) {
    const { query, expectedKeywords, description } = test;

    console.log(`\nTest: ${description}`);
    console.log(`Query: ${query}`);
    console.log("-".repeat(50));

    try {
      const finalAnswer: string = await invokeGraph(query, graph);

      const lower = finalAnswer.toLowerCase();

      const found = expectedKeywords.filter(k =>
        lower.includes(k.toLowerCase())
      );

      const missing = expectedKeywords.filter(k =>
        !lower.includes(k.toLowerCase())
      );

      console.log(`Expected: ${JSON.stringify(expectedKeywords)}`);
      console.log(`Found:    ${JSON.stringify(found)}`);
      if (missing.length)
        console.log(`Missing:  ${JSON.stringify(missing)}`);

      console.log(`Answer Preview: ${finalAnswer.substring(0, 200)}...`);
    } catch (err) {
      console.error("Error:", err);
    }

    console.log("=".repeat(50));
  }
})();
