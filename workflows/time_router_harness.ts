import dotenv from "dotenv";
import path from "path";

// Load environment variables before importing the agent
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import { classifyTime } from "./agents/time_router_agent";

// Define test cases for time range classification
const TEST_CASES = [
  {
    input: "Who received funding today",
    expected: {
      start: (() => {
        const d = new Date();
        d.setHours(0, 1, 0, 0); // 12:01 AM today
        return Math.floor(d.getTime() / 1000);
      })(),

      end: (() => {
        const d = new Date();
        d.setMinutes(0, 0, 0); // round to the hour
        return Math.floor(d.getTime() / 1000);
      })(),
    },
  },
  {
    input: "Who was funded this week",
    expected: {
      start: (() => {
        const d = new Date();
        const day = d.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const diff = day === 0 ? 6 : day - 1; // Treat Monday as start of week
        d.setDate(d.getDate() - diff);
        d.setHours(0, 0, 0, 0);
        return Math.floor(d.getTime() / 1000);
      })(),

      end: (() => {
        const d = new Date();
        return Math.floor(d.getTime() / 1000);
      })(),
    },
  },
  {
    input: "Show me companies from the last week",
    expected: {
      start: (() => {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        return Math.floor(d.getTime() / 1000);
      })(),
      end: (() => {
        const d = new Date();
        return Math.floor(d.getTime() / 1000);
      })(),
    },
  },
];

  // {
  //   input: "Show me companies from the last 6 months",
  //   expected: {
  //     start: new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString().split('T')[0],
  //     end: new Date().toISOString().split('T')[0],
  //   },
  // },
  // {
  //   input: "Who funded startups in 2024?",
  //   expected: {
  //     start: "2024-01-01",
  //     end: "2024-12-31",
  //   },
  // },
  // {
  //   input: "Companies founded in the past year",
  //   expected: {
  //     start: new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().split('T')[0],
  //     end: new Date().toISOString().split('T')[0],
  //   },
  // },
  // {
  //   input: "Recent fintech investments",
  //   expected: {
  //     start: new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString().split('T')[0],
  //     end: new Date().toISOString().split('T')[0],
  //   },
  // },
  // {
  //   input: "Companies from Q1 2024",
  //   expected: {
  //     start: "2024-01-01",
  //     end: "2024-03-31",
  //   },
  // },
  // {
  //   input: "Startups founded between January and March 2023",
  //   expected: {
  //     start: "2023-01-01",
  //     end: "2023-03-31",
  //   },
  // },
  // {
  //   input: "Show me investments in the last 2 years",
  //   expected: {
  //     start: new Date(new Date().setFullYear(new Date().getFullYear() - 2)).toISOString().split('T')[0],
  //     end: new Date().toISOString().split('T')[0],
  //   },
  // },
  // {
  //   input: "Companies funded this month",
  //   expected: {
  //     start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
  //     end: new Date().toISOString().split('T')[0],
  //   },
  // },
// ];

interface TestResult {
  query: string;
  expectedStart: number;
  expectedEnd: number;
  predictedStart: number;
  predictedEnd: number;
  confidence: string;
  status: string;
  rationale: string;
}

function timestampsMatch(ts1: number, ts2: number, toleranceSeconds: number = 86400): boolean {
  // Default tolerance is 1 day (86400 seconds)
  const diffSeconds = Math.abs(ts1 - ts2);
  return diffSeconds <= toleranceSeconds;
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
      // Use lower confidence threshold to avoid fallback
      const result = await classifyTime(query, "gpt-4o-mini", 0.0);
      const predictedStart = result.start;
      const predictedEnd = result.end;
      const rationale = result.rationale;
      const confidence = result.confidence;

      const startMatch = timestampsMatch(predictedStart, expectedStart);
      const endMatch = timestampsMatch(predictedEnd, expectedEnd);
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
        predictedStart: 0,
        predictedEnd: 0,
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
