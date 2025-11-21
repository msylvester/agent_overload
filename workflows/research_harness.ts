#!/usr/bin/env ts-node
/**
 * Test harness for research workflow
 *
 * This harness tests the research workflow with various queries
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { runResearchWorkflow, WorkflowOutput } from './research_workflow';

// Load environment variables from .env.local
config({ path: resolve(__dirname, '../.env.local') });

interface TestQuery {
  query: string;
  expected: string;
  description: string;
}

interface TestResult {
  query: string;
  success: boolean;
  found_expected: boolean;
  companies_count: number;
  error?: string;
  result?: any;
}

// Test data - same queries as in Python version
const TEST_QUERIES: TestQuery[] = [
  {
    query: "storage technology",
    expected: "Vast Data",
    description: "Should find storage technology companies like Vast Data"
  },
  {
    query: "medical research",
    expected: "Tahoe",
    description: "Should find medical research companies like Tahoe Therapeutics"
  },
  {
    query: "enterprise grade developer tools",
    expected: "Uno",
    description: "Should find developer tools companies like Uno Platform"
  },
  {
    query: "ai powered speech translation",
    expected: "Palabra",
    description: "Should find AI speech translation companies like Palabra AI"
  },
  {
    query: "ai powered sleep tech",
    expected: "Eight Sleep",
    description: "Should find AI sleep tech companies like Eight Sleep"
  }
];

/**
 * Run a single test case
 */
async function runSingleTest(queryData: TestQuery): Promise<TestResult> {
  const { query, expected, description } = queryData;

  console.log(`\nQuery: ${query}`);
  console.log(`Expected to find: ${expected}`);
  console.log(`Description: ${description}`);
  console.log("-".repeat(50));

  try {
    // Run the actual research workflow
    const result = await runResearchWorkflow(query);

    // Extract data from RAG results
    const ragSources = result.ragResults?.sources || [];
    const webCompanies = result.webResults?.companies || [];

    console.log(`\nRAG Results:`);
    console.log(`  Sources found: ${ragSources.length}`);
    console.log(`  Confidence: ${result.ragResults?.confidenceScore?.toFixed(2) || 'N/A'}`);

    for (let i = 0; i < Math.min(ragSources.length, 5); i++) {
      const source = ragSources[i];
      console.log(`  ${i + 1}. ${source.companyName || 'Unknown'}`);
      console.log(`     Relevance: ${source.relevanceScore?.toFixed(2) || 'N/A'}`);
      console.log(`     Snippet: ${(source.documentSnippet || '').substring(0, 100)}...`);
    }

    console.log(`\nRAG Answer:`);
    console.log(`  ${(result.ragResults?.answer || 'N/A').substring(0, 300)}...`);

    if (webCompanies.length > 0) {
      console.log(`\nWeb Research Results:`);
      console.log(`  Companies enriched: ${webCompanies.length}`);

      for (let i = 0; i < Math.min(webCompanies.length, 5); i++) {
        const company = webCompanies[i];
        console.log(`  ${i + 1}. ${company.company_name || 'Unknown'}`);
        console.log(`     Industry: ${company.industry || 'N/A'}`);
        console.log(`     Location: ${company.headquarters_location || 'N/A'}`);
        console.log(`     Website: ${company.website || 'N/A'}`);
      }
    }

    // Check if expected result is in the output
    const allText = JSON.stringify(result).toLowerCase();
    const foundExpected = allText.includes(expected.toLowerCase());

    return {
      query,
      success: true,
      found_expected: foundExpected,
      companies_count: ragSources.length + webCompanies.length,
      result
    };

  } catch (e) {
    const error = e as Error;
    console.log(`Error: ${error.message}`);
    console.error(error.stack);

    return {
      query,
      success: false,
      error: error.message,
      found_expected: false,
      companies_count: 0
    };
  }
}

/**
 * Run all test cases
 */
async function runAllTests(): Promise<TestResult[]> {
  console.log("Testing Research Workflow...");
  console.log("=".repeat(50));

  const results: TestResult[] = [];

  for (const queryData of TEST_QUERIES) {
    const result = await runSingleTest(queryData);
    results.push(result);
    console.log("=".repeat(50));
  }

  // Summary
  console.log("\n" + "=".repeat(50));
  console.log("TEST SUMMARY");
  console.log("=".repeat(50));

  const total = results.length;
  const successful = results.filter(r => r.success).length;
  const foundExpected = results.filter(r => r.found_expected).length;

  console.log(`Total tests: ${total}`);
  console.log(`Successful executions: ${successful}/${total}`);
  console.log(`Found expected results: ${foundExpected}/${total}`);

  console.log("\nDetailed Results:");
  results.forEach((result, i) => {
    const status = (result.success && result.found_expected) ? "PASS" : "FAIL";
    console.log(`  ${i + 1}. ${result.query}: ${status}`);
    if (!result.success) {
      console.log(`     Error: ${result.error || 'Unknown'}`);
    } else if (!result.found_expected) {
      console.log(`     Warning: Expected result not found in output`);
    }
  });

  return results;
}

/**
 * Main entry point
 */
async function main() {
  await runAllTests();
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}
