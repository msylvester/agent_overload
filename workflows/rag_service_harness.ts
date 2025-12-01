/**
 * RAG Service Test Harness
 *
 * Standalone test runner for the RAG service agent.
 * Run with: pnpm tsx workflows/rag_service_harness.ts
 */

import { runRagQuery } from './rag_router_agent';

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
