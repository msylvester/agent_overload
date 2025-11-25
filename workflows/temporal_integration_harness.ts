#!/usr/bin/env ts-node

/**
 * Test harness for the temporal research workflow
 */

import { config } from "dotenv";
import { resolve } from "path";
import { temporalIntent } from "./temporal_integration_workflow";
import type { WorkflowOutput } from "./temporal_integration_workflow";


// Load environment variables from .env.local
config({ path: resolve(__dirname, "../.env.local") });

interface TestQuery {
  query: string;
  expected: number;
  description: string;
}

interface TestResult {
  query: string;
  expected: number;
  success: boolean;
  companies_count: number;
  description: string;
  error?: string;
  result?: WorkflowOutput;
}

// --- Test Cases ---
const TEST_QUERIES: TestQuery[] = [
  {
    query: "Show me companies from the last 6 months",
    expected: 40,
    description: "Should find companies funded in the last 6 months",
  },
  {
    query: "Show me companies from the last 7 days",
    expected: 2,
    description: "Should find companies funded in the last 7 days",
  },
];

// --- Harness ---
async function runTemporalTests(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  for (const test of TEST_QUERIES) {
    const { query, expected, description } = test;

    try {
      const workflowResult: WorkflowOutput = await temporalIntent(query);
      const companies = workflowResult?.results?.companies ?? [];
      const success = companies.length === expected;

      results.push({
        query,
        expected,
        success,
        companies_count: companies.length,
        description,
        result: workflowResult,
      });
    } catch (err: any) {
      results.push({
        query,
        expected,
        success: false,
        companies_count: 0,
        description,
        error: err?.message || String(err),
      });
    }
  }

  return results;
}

// --- Entrypoint ---
(async () => {
  try {
    const results = await runTemporalTests();

    console.log(`\n=== Test Results ===`);
    console.log(JSON.stringify(results, null, 2));

    const passed = results.filter((r) => r.success).length;
    const total = results.length;

    console.log(`\nTests passed: ${passed}/${total}`);
  } catch (e) {
    console.error(`Unexpected error running test harness:`, e);
  }
})();
