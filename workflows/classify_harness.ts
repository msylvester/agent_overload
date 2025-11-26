import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(__dirname, '../.env.local') });

import { classifyIntent } from './agents/classify_agent';

interface Question {
  input: string,
  expected: string,
}
interface Result {
  query: string,
  expected: string,
  predicted: string,
  status: boolean
}
let results: Result[] = [];
let TestCases: Question[] = [];

TestCases.push({ "input": "What investors would be interested in my SaaS product?", "expected": "basic" });
TestCases.push({ "input": "Research Tesla", "expected": "research" });
TestCases.push({ "input": "Tell me about SpaceX funding", "expected": "research" });
TestCases.push({ "input": "How should I pitch my AI startup?", "expected": "basic" });

// Added research cases
TestCases.push({ "input": "Find recent news about OpenAI leadership changes", "expected": "research" });
TestCases.push({ "input": "Give me the latest financial performance of Nvidia", "expected": "research" });
TestCases.push({ "input": "Look up the market size of the cybersecurity industry", "expected": "research" });
TestCases.push({ "input": "Has Apple released any new products this quarter?", "expected": "research" });
TestCases.push({ "input": "Get me information on Sequoia Capital's latest investments", "expected": "research" });

// Time-based cases (should be classified as "time", not "research")
TestCases.push({ "input": "Who has been funded in the last 6 days", "expected": "time" });
TestCases.push({ "input": "Who has been funded in the last week", "expected": "time" });
TestCases.push({ "input": "Who has been funded in 2024", "expected": "time" });
TestCases.push({ "input": "Who has been funded in the last month", "expected": "time" });
TestCases.push({ "input": "Companies funded in Q1 2024", "expected": "time" });
TestCases.push({ "input": "Show me startups founded since January", "expected": "time" });
TestCases.push({ "input": "Which companies received funding this year", "expected": "time" });
TestCases.push({ "input": "Funding rounds from the past 30 days", "expected": "time" });

// Research cases (specific companies, no time constraint)
TestCases.push({ "input": "Tell me about Stripe's funding history", "expected": "research" });
TestCases.push({ "input": "Find AI companies in healthcare", "expected": "research" });


/***
 * classifyHarness(String)
 * @param input
 * returns void
 */

const classifyHarness = async () => {
  //use the classify method on the input and compare to expected
  //
  for (let test of TestCases) {
    const { input, expected } = test;
    const result = await classifyIntent(input);
    const predicted = result?.intent;
    const status = predicted === expected;
    //compare the result with what is expected, if expected match -> ✅, o/w ❌

    const statusIcon = status ? '✅' : '❌';
    console.log(`${statusIcon} ${input} - Expected: ${expected}, Predicted: ${predicted}`);
    results.push({ query: input, expected: expected, predicted, status });
  }

  console.log('\n=== Test Results ===');
  console.log(`Total tests: ${results.length}`);
  console.log(`Passed: ${results.filter(r => r.status).length}`);
  console.log(`Failed: ${results.filter(r => !r.status).length}`);
}

// Run the harness
classifyHarness();



