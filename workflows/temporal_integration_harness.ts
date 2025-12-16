#!/usr/bin/env ts-node

/**
 * Test harness for the temporal research workflow
 */

import { config } from "dotenv";
import { resolve } from "path";
import { agenticApp } from "./fromScratch";
import type { TimeClassification } from "./fromScratch";
import type { ResponseItem } from "./agents/temporal_router_agent";


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
  timeClassification?: TimeClassification;
  results?: ResponseItem | null;
}

// --- Test Cases ---
const TEST_QUERIES: TestQuery[] = [
  {
    query: " who was fudned in september 2025",
    expected: 12,
    description: "Should find companies funded in sepetember",
  },
 
 
  {
    query: "Show me companies from the last 6 months",
    expected: 50,
    description: "Should find companies funded in the last 6 months",
  },
  {
    query: "Show me companies from the last 7 days",
    expected: 5,
    description: "Should find companies funded in the last 7 days",
  },
  {
    query: "show me companies from the last 2 weeks",
    expected: 10,
    description: "Should find companies funded in the last 2 weeks"
  },
 {
    query: "any companies funded in november 2025",
    expected: 19,
    description: "Should find companies funded in the last 2 weeks"
  },
 {
    query: "any companies funded yesterday?",
    expected: 0,
    description: "Should skip temporalAdvice - validation fails and confidence < 0.7"
  },
  {
    query: "who was funded in november october movember",
    expected: 31,
    description: "Confusing time query that LLM interprets as Oct-Nov range"
  }
];

// --- Harness ---
async function runTemporalTests(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  for (const test of TEST_QUERIES) {
    const { query, expected, description } = test;

    try {
      const state = await agenticApp.invoke({
        query,
        model: "gpt-4o-mini",
        currentExtraction: null,
        previousExtractions: [],
        results: null,
        validationErrors: [],
        validationPassed: false,
        attemptCount: 0,
        maxAttempts: 2,
        finalResult: null,
      });

      const companies = state?.results?.companies ?? [];
      const success = companies.length <= expected;

      results.push({
        query,
        expected,
        success,
        companies_count: companies.length,
        description,
        timeClassification: state.finalResult ?? undefined,
        results: state.results,
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
