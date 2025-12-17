/**
 * Evaluation Script for Agentic RAG System
 *
 * Tests the MongoDB-backed RAG system with company funding and description data
 * Evaluates retrieval quality and answer generation
 */

import { buildGraph, invokeGraph } from "../web_yt_vid/agentic_two_rag.js";
import type { AgentState } from "../web_yt_vid/agentic_two_rag.js";
import { HumanMessage } from "@langchain/core/messages";

// ============================================================================
// TEST CASES
// ============================================================================

interface TestCase{
  query: string;
  expectedKeywords: string[];
  description: string;
}
const TEST_CASES: TestCase[] = [
 {
     query: "companies that do music generation", // should at least select Vast Data
     expectedKeywords: ["Suno", "Generative", "model"],
     description: "Should find all the companies that do ai music generation"
   },
 
 {
     query:  "data storage infastrucutre comanies", // should at least select Vast Data
     expectedKeywords: ["Vast Data"],
     description: "Should find all the companies that do data storage"
   },
 {
    query: "what are some fusion companies that have been fudned",
    expectedKeywords: ["Fusion", "Commonwealth"],
    description: "Should find all the companies that do energy and make mention of fusion"
  },
 
 {
    query: "whats going on with energy innvoation",
    expectedKeywords: ["Quilt", "Exo", "Fusion", "Tulum"],
    description: "Should discuss Exo and Tulum"
  },
 {
    query: "who are some dev tool companies",
    expectedKeywords: ["Emergent", "Cursor", "No Code"],
    description: "Should discuss the no code platforms "
  },

];
/*
const TEST_CASES: TestCase[] = [
 {
     query: "what does fleetworks do",
     expectedKeywords: ["freight", "trucking", "voice", "agent", "AI", "shipping"],
     description: "Should describe FleetWorks business and products"
   },
 {
    query: "what jobs does Fleetworks have",
    expectedKeywords: ["Software Engineer", "Product Manager", "Marketing", "Engineering"],
    description: "Should describe the available roles"
  },
 {
    query: "what are the responsibilities for the senior software engineering role",
    expectedKeywords: ["end-to-end ", "ownership"],
    description: "Should describe the available roles"
  },

];
*/
// ============================================================================
// EVALUATION FUNCTIONS
// ============================================================================

function checkKeywords(answer: string, keywords: string[]): {
  found: string[];
  missing: string[];
  score: number;
} {
  const lowerAnswer = answer.toLowerCase();
  const found: string[] = [];
  const missing: string[] = [];

  for (const keyword of keywords) {
    if (lowerAnswer.includes(keyword.toLowerCase())) {
      found.push(keyword);
    } else {
      missing.push(keyword);
    }
  }

  const score = found.length / keywords.length;
  return { found, missing, score };
}

async function evaluateQuery(
  graph: Awaited<ReturnType<typeof buildGraph>>,
  testCase: TestCase
): Promise<{
  passed: boolean;
  answer: string;
  score: number;
  found: string[];
  missing: string[];
}> {
  console.log(`\n${"=".repeat(80)}`);
  console.log(`TEST: ${testCase.description}`);
  console.log(`QUERY: "${testCase.query}"`);
  console.log("=".repeat(80));

  // Invoke graph and get final answer directly
  const finalAnswer = await invokeGraph(testCase.query, graph);

  console.log(`\nFINAL ANSWER:\n${finalAnswer}`);

  // Evaluate answer
  const { found, missing, score } = checkKeywords(finalAnswer, testCase.expectedKeywords);

  console.log(`\nEVALUATION:`);
  console.log(`  Keywords Found: [${found.join(", ")}]`);
  console.log(`  Keywords Missing: [${missing.join(", ")}]`);
  console.log(`  Score: ${(score * 100).toFixed(1)}%`);

  const passed = score >= 0.5; // Pass if 50%+ keywords found
  console.log(`  Result: ${passed ? "✓ PASS" : "✗ FAIL"}`);

  return {
    passed,
    answer: finalAnswer,
    score,
    found,
    missing
  };
}

// ============================================================================
// MAIN EVALUATION
// ============================================================================

async function main() {
  console.log("\n" + "=".repeat(80));
  console.log("AGENTIC RAG EVALUATION - Company Data");
  console.log("=".repeat(80));

  // Build the graph
  console.log("\n[INFO] Building RAG graph...");
  const graph = await buildGraph();
  console.log("[SUCCESS] Graph built successfully\n");

  // Run all test cases
  const results = [];

  for (const testCase of TEST_CASES) {
    try {
      const result = await evaluateQuery(graph, testCase);
      results.push({
        testCase,
        ...result
      });
    } catch (error) {
      console.error(`\n✗ ERROR in test: ${error}`);
      results.push({
        testCase,
        passed: false,
        answer: "",
        score: 0,
        found: [],
        missing: testCase.expectedKeywords,
        error: String(error)
      });
    }
  }

  // Summary Report
  console.log("\n" + "=".repeat(80));
  console.log("EVALUATION SUMMARY");
  console.log("=".repeat(80));

  const passedTests = results.filter(r => r.passed).length;
  const totalTests = results.length;
  const avgScore = results.reduce((sum, r) => sum + r.score, 0) / totalTests;

  console.log(`\nTests Passed: ${passedTests}/${totalTests}`);
  console.log(`Average Score: ${(avgScore * 100).toFixed(1)}%`);
  console.log(`Overall Result: ${passedTests === totalTests ? "✓ ALL PASS" : "✗ SOME FAILURES"}`);

  console.log("\nDetailed Results:");
  results.forEach((result, idx) => {
    console.log(`\n${idx + 1}. ${result.testCase.description}`);
    console.log(`   Query: "${result.testCase.query}"`);
    console.log(`   Status: ${result.passed ? "✓ PASS" : "✗ FAIL"}`);
    console.log(`   Score: ${(result.score * 100).toFixed(1)}%`);
    if (result.missing.length > 0) {
      console.log(`   Missing: [${result.missing.join(", ")}]`);
    }
  });

  console.log("\n" + "=".repeat(80));

  process.exit(passedTests === totalTests ? 0 : 1);
}

// ============================================================================
// RUN
// ============================================================================

main().catch((error) => {
  console.error("FATAL ERROR:", error);
  process.exit(1);
});
