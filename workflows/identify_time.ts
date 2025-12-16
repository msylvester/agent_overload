import { classifyTime } from "./fromScratch";

// Define test cases for time range classification
const TEST_CASES = [
  {
    input: "Show me companies from the last 6 months",
    expected: {
      start: new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0],
    },
  },
  {
    input: "Who funded startups in 2024?",
    expected: {
      start: "2024-01-01",
      end: "2024-12-31",
    },
  },
  {
    input: "Companies founded in the past year",
    expected: {
      start: new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0],
    },
  },
  {
    input: "Recent fintech investments",
    expected: {
      start: new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0],
    },
  },
  {
    input: "Companies from Q1 2024",
    expected: {
      start: "2024-01-01",
      end: "2024-03-31",
    },
  },
  {
    input: "Startups founded between January and March 2023",
    expected: {
      start: "2023-01-01",
      end: "2023-03-31",
    },
  },
  {
    input: "Show me investments in the last 2 years",
    expected: {
      start: new Date(new Date().setFullYear(new Date().getFullYear() - 2)).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0],
    },
  },
  {
    input: "Companies funded this month",
    expected: {
      start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0],
    },
  },
  {
    input: "Show me startups from Q2 2023",
    expected: {
      start: "2023-04-01",
      end: "2023-06-30",
    },
  },
  {
    input: "Investments in the last 30 days",
    expected: {
      start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0],
    },
  },
  {
    input: "Companies founded in Q3 2024",
    expected: {
      start: "2024-07-01",
      end: "2024-09-30",
    },
  },
  {
    input: "Ventures from Q4 2023",
    expected: {
      start: "2023-10-01",
      end: "2023-12-31",
    },
  },
  {
    input: "Show me deals from the last 90 days",
    expected: {
      start: new Date(new Date().setDate(new Date().getDate() - 90)).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0],
    },
  },
  {
    input: "Startups founded in March 2024",
    expected: {
      start: "2024-03-01",
      end: "2024-03-31",
    },
  },
  {
    input: "Companies from the last 18 months",
    expected: {
      start: new Date(new Date().setMonth(new Date().getMonth() - 18)).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0],
    },
  },
  {
    input: "Investments in 2023",
    expected: {
      start: "2023-01-01",
      end: "2023-12-31",
    },
  },
  {
    input: "Show me companies from the past 3 years",
    expected: {
      start: new Date(new Date().setFullYear(new Date().getFullYear() - 3)).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0],
    },
  },
  {
    input: "Startups founded in December 2023",
    expected: {
      start: "2023-12-01",
      end: "2023-12-31",
    },
  },
  {
    input: "Companies from the last 7 days",
    expected: {
      start: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0],
    },
  },
  {
    input: "Ventures funded in the past 5 years",
    expected: {
      start: new Date(new Date().setFullYear(new Date().getFullYear() - 5)).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0],
    },
  },
  {
    input: "Show me investments from January to June 2024",
    expected: {
      start: "2024-01-01",
      end: "2024-06-30",
    },
  },
  {
    input: "Companies founded this year",
    expected: {
      start: `${new Date().getFullYear()}-01-01`,
      end: new Date().toISOString().split('T')[0],
    },
  },
  {
    input: "Startups from the last quarter",
    expected: {
      start: new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0],
    },
  },
  {
    input: "Companies funded in April 2023",
    expected: {
      start: "2023-04-01",
      end: "2023-04-30",
    },
  },
  {
    input: "Show me deals from the last 60 days",
    expected: {
      start: new Date(new Date().setDate(new Date().getDate() - 60)).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0],
    },
  },
  {
    input: "Investments between July and September 2024",
    expected: {
      start: "2024-07-01",
      end: "2024-09-30",
    },
  },
  {
    input: "Companies from the first half of 2024",
    expected: {
      start: "2024-01-01",
      end: "2024-06-30",
    },
  },
  {
    input: "Show me startups from the second half of 2023",
    expected: {
      start: "2023-07-01",
      end: "2023-12-31",
    },
  },
];

interface TestResult {
  query: string;
  expectedStart: string;
  expectedEnd: string;
  predictedStart: string;
  predictedEnd: string;
  confidence: string;
  status: string;
  rationale: string;
}

function datesMatch(date1: string, date2: string, toleranceDays: number = 1): boolean {
  const d1 = new Date(date1).getTime();
  const d2 = new Date(date2).getTime();
  const diffDays = Math.abs(d1 - d2) / (1000 * 60 * 60 * 24);
  return diffDays <= toleranceDays;
}

async function runTimeTests(): Promise<void> {
  const results: TestResult[] = [];

  console.log("\n=== TIME RANGE CLASSIFICATION TEST RESULTS ===\n");

  for (let i = 0; i < TEST_CASES.length; i++) {
    const testCase = TEST_CASES[i];
    const query = testCase.input;
    const expectedStart = testCase.expected.start;
    const expectedEnd = testCase.expected.end;

    try {
      const result = await classifyTime(query);
      const predictedStart = result.start;
      const predictedEnd = result.end;
      const rationale = result.rationale;
      const confidence = result.confidence;

      const startMatch = datesMatch(predictedStart, expectedStart);
      const endMatch = datesMatch(predictedEnd, expectedEnd);
      const status = startMatch && endMatch ? "✅ PASS" : "❌ FAIL";

      results.push({
        query,
        expectedStart,
        expectedEnd,
        predictedStart,
        predictedEnd,
        confidence: confidence.toFixed(2),
        status,
        rationale,
      });

      // Print immediately after each classification
      console.log(`Test ${i + 1}:`);
      console.log(`  Query: ${query}`);
      console.log(`  Expected Start: ${expectedStart}`);
      console.log(`  Expected End: ${expectedEnd}`);
      console.log(`  Predicted Start: ${predictedStart} ${startMatch ? "✓" : "✗"}`);
      console.log(`  Predicted End: ${predictedEnd} ${endMatch ? "✓" : "✗"}`);
      console.log(`  Confidence: ${confidence.toFixed(2)}`);
      console.log(`  Status: ${status}`);
      console.log(`  Rationale: ${rationale}`);
      console.log();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      results.push({
        query,
        expectedStart,
        expectedEnd,
        predictedStart: "ERROR",
        predictedEnd: "ERROR",
        confidence: "0.00",
        status: "❌ FAIL",
        rationale: errorMessage,
      });

      // Print error immediately
      console.log(`Test ${i + 1}:`);
      console.log(`  Query: ${query}`);
      console.log(`  Expected Start: ${expectedStart}`);
      console.log(`  Expected End: ${expectedEnd}`);
      console.log(`  Predicted Start: ERROR`);
      console.log(`  Predicted End: ERROR`);
      console.log(`  Confidence: 0.00`);
      console.log(`  Status: ❌ FAIL`);
      console.log(`  Rationale: ${errorMessage}`);
      console.log();
    }
  }

  // Print summary
  const passed = results.filter((r) => r.status === "✅ PASS").length;
  const failed = results.length - passed;
  console.log("=== SUMMARY ===");
  console.log(`Total tests: ${results.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Pass rate: ${((passed / results.length) * 100).toFixed(1)}%`);
}

// Main execution
if (require.main === module) {
  runTimeTests()
    .then(() => {
      console.log("\n✓ Test harness completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n✗ Test harness failed:", error);
      process.exit(1);
    });
}

export { runTimeTests };
