/**
 * Test Harness for fromScratch.ts
 * Tests the complete time classification and temporal analysis workflow
 */

import { classifyTime } from './fromScratch';

// ANSI color codes for better output readability
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
};

interface TestCase {
  name: string;
  query: string;
  model?: string;
}

const testCases: TestCase[] = [
  {
    name: "Test 1: Who was funded in november",
    query: "Who was funded in november",
    model: "gpt-4o-mini",
  },
  {
    name: "Test 2: Who was funded recently",
    query: "Who was funded recently",
    model: "gpt-4o-mini",
  },
];

async function runTest(testCase: TestCase): Promise<void> {
  console.log(`\n${colors.bright}${colors.blue}========================================${colors.reset}`);
  console.log(`${colors.bright}${testCase.name}${colors.reset}`);
  console.log(`${colors.blue}========================================${colors.reset}`);
  console.log(`Query: "${testCase.query}"`);
  console.log(`Model: ${testCase.model || 'gpt-4o-mini'}`);
  console.log();

  try {
    const startTime = Date.now();
    const result = await classifyTime(testCase.query, testCase.model);
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log(`\n${colors.bright}${colors.green}✓ TEST PASSED${colors.reset}`);
    console.log(`${colors.bright}Duration: ${duration}s${colors.reset}`);

    console.log(`\n${colors.bright}Time Classification:${colors.reset}`);
    console.log(`  Start Date: ${result.timeClassification.start}`);
    console.log(`  End Date:   ${result.timeClassification.end}`);
    console.log(`  Confidence: ${result.timeClassification.confidence.toFixed(2)}`);
    console.log(`  Rationale:  ${result.timeClassification.rationale}`);

    if (result.results) {
      console.log(`\n${colors.bright}Temporal Analysis Results:${colors.reset}`);
      console.log(`  Companies Found: ${result.results.companies.length}`);

      if (result.results.companies.length > 0) {
        console.log(`\n  ${colors.bright}Sample Companies (first 10):${colors.reset}`);
        result.results.companies.slice(0, 10).forEach((company, idx) => {
          console.log(`    ${idx + 1}. ${company}`);
        });
      }

      console.log(`\n  ${colors.bright}Inference:${colors.reset}`);
      // Word wrap the inference at 80 characters
      const words = result.results.inference.split(' ');
      let line = '  ';
      for (const word of words) {
        if (line.length + word.length + 1 > 80) {
          console.log(line);
          line = '  ' + word;
        } else {
          line += (line.length > 2 ? ' ' : '') + word;
        }
      }
      if (line.length > 2) {
        console.log(line);
      }
    } else {
      console.log(`\n${colors.yellow}⚠ No temporal analysis results (low confidence extraction)${colors.reset}`);
    }

    return;
  } catch (err) {
    console.log(`\n${colors.bright}${colors.red}✗ TEST FAILED${colors.reset}`);
    console.error(`${colors.red}Error:${colors.reset}`, err);
    throw err;
  }
}

async function runAllTests(): Promise<void> {
  console.log(`${colors.bright}${colors.blue}╔════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}║  FromScratch Test Harness              ║${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}║  Running ${testCases.length} test case(s)                  ║${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}╚════════════════════════════════════════╝${colors.reset}`);

  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    try {
      await runTest(testCase);
      passed++;
    } catch (err) {
      failed++;
    }
  }

  console.log(`\n${colors.bright}${colors.blue}========================================${colors.reset}`);
  console.log(`${colors.bright}Test Summary${colors.reset}`);
  console.log(`${colors.blue}========================================${colors.reset}`);
  console.log(`Total Tests:  ${testCases.length}`);
  console.log(`${colors.green}Passed:       ${passed}${colors.reset}`);
  if (failed > 0) {
    console.log(`${colors.red}Failed:       ${failed}${colors.reset}`);
  }
  console.log();

  if (failed > 0) {
    process.exit(1);
  }
}

// Run the tests
if (require.main === module) {
  runAllTests().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  });
}

export { runAllTests, testCases };
