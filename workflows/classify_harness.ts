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

TestCases.push({ "input": "What investors would be interested in my SaaS product?", "expected": "advice" });
TestCases.push({ "input": "Research Tesla", "expected": "research" });
TestCases.push({ "input": "Tell Mea bout SpaceX Funding", "expected": "research" });
TestCases.push({ "input": "How should I pitch my AI startup?", "expected": "advice" });

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



