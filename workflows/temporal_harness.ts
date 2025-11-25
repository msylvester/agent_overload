import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local (project root)
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { getTemporal } from './agents/temporal_agent';

interface TemporalResponse {
  companies: string[];
  inference: string;
}

// Helper functions for date calculation
function getCurrentDate(): string {
  return new Date().toISOString().split('T')[0];
}

function getDateMonthsAgo(months: number): string {
  const date = new Date();
  date.setMonth(date.getMonth() - months);
  return date.toISOString().split('T')[0];
}

function getDateDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
}

// Test data with pre-computed dates
const TEST_DATA = [
  {
    description: "Last week",
    input: "Who has been funded recently?",
    start_date: getDateDaysAgo(7),
    end_date: getCurrentDate(),
    expectedMinCompanies: 2,
  },
  {
    description: "Last month",
    input: "What are trending companies?",
    start_date: getDateMonthsAgo(1),
    end_date: getCurrentDate(),
    expectedMinCompanies: 13,
  },
  {
    description: "Last 6 months",
    input: "Analyze recent startup activity",
    start_date: getDateMonthsAgo(7),
    end_date: getCurrentDate(),
    expectedMinCompanies: 24,
  },
  {
    description: "Q1 2024",
    input: "What were the trends in AI startups?",
    start_date: "2024-01-01",
    end_date: "2024-03-31",
    expectedMinCompanies: 3,
  },
  {
    description: "Full year 2024",
    input: "Analyze fintech companies",
    start_date: "2024-01-01",
    end_date: "2024-12-31",
    expectedMinCompanies: 5,
  },
];

interface TestResult {
  description: string;
  input: string;
  start_date: string;
  end_date: string;
  expectedMinCompanies: number;
  actualCompanyCount: number;
  companies: string[];
  inference: string;
  pass: boolean;
}

async function runTemporalTests(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  console.log("\n=== TEMPORAL AGENT TEST HARNESS ===\n");

  for (const test of TEST_DATA) {
    console.log(`\nTest: ${test.description}`);
    console.log(`  Query: ${test.input}`);
    console.log(`  Date range: ${test.start_date} to ${test.end_date}`);

    try {
      const response: TemporalResponse = await getTemporal(
        test.input,
        test.start_date,
        test.end_date
      );

      const { companies, inference } = response;
      const pass = companies.length >= test.expectedMinCompanies;

      results.push({
        description: test.description,
        input: test.input,
        start_date: test.start_date,
        end_date: test.end_date,
        expectedMinCompanies: test.expectedMinCompanies,
        actualCompanyCount: companies.length,
        companies,
        inference,
        pass,
      });

      console.log(`  Found ${companies.length} companies (expected min: ${test.expectedMinCompanies})`);
      console.log(`  Status: ${pass ? '✅ PASS' : '❌ FAIL'}`);

    } catch (error) {
      console.error(`  Error:`, error);
      results.push({
        description: test.description,
        input: test.input,
        start_date: test.start_date,
        end_date: test.end_date,
        expectedMinCompanies: test.expectedMinCompanies,
        actualCompanyCount: 0,
        companies: [],
        inference: `Error: ${error}`,
        pass: false,
      });
    }
  }

  return results;
}

(async () => {
  try {
    const results = await runTemporalTests();

    console.log('\n=== TEST SUMMARY ===');
    console.log(`Total tests: ${results.length}`);
    console.log(`Passed: ${results.filter(r => r.pass).length}`);
    console.log(`Failed: ${results.filter(r => !r.pass).length}`);

    console.log('\n=== DETAILED RESULTS ===');
    console.log(JSON.stringify(results, null, 2));

  } catch (error) {
    console.error('Error running temporal harness:', error);
    process.exit(1);
  }
})();
