/**
 * Time Range Classification Agent
 *
 * This module provides time range extraction for user queries using OpenAI.
 * It uses structured output to extract start and end dates with confidence scoring.
 */

import dotenv from 'dotenv';
import path from 'path';
// Load environment variables before any other imports
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import OpenAI from "openai";
import { z } from "zod";

// ===============================
// SCHEMA
// ===============================

const TimeClassificationSchema = z.object({
  start: z.string().describe("Start date in ISO format (YYYY-MM-DD)"),
  end: z.string().describe("End date in ISO format (YYYY-MM-DD)"),
  confidence: z.number().min(0).max(1).describe("Confidence score between 0 and 1"),
  rationale: z.string().describe("Brief explanation for the date range extraction"),
});

export type TimeClassification = z.infer<typeof TimeClassificationSchema>;

// ===============================
// HELPER FUNCTIONS
// ===============================

/**
 * Get current date in ISO format (YYYY-MM-DD)
 */
function getCurrentDate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Calculate a date N months ago
 */
function getDateMonthsAgo(months: number): string {
  const date = new Date();
  date.setMonth(date.getMonth() - months);
  return date.toISOString().split('T')[0];
}

/**
 * Calculate a date N years ago
 */
function getDateYearsAgo(years: number): string {
  const date = new Date();
  date.setFullYear(date.getFullYear() - years);
  return date.toISOString().split('T')[0];
}

// ===============================
// MAIN CLASSIFICATION FUNCTION
// ===============================

/**
 * Extract time range (start and end dates) from a user query using OpenAI.
 *
 * This function:
 * 1. Uses OpenAI with structured output to extract date ranges from natural language
 * 2. Returns start_date, end_date with confidence score
 * 3. Falls back to reasonable defaults if no clear time range is found
 *
 * @param query - User's query text mentioning time ranges
 * @param model - OpenAI model to use (default: gpt-4o-mini - supports structured outputs)
 * @param minConfidence - Minimum confidence threshold (default: 0.6)
 * @returns TimeClassification with start, end, confidence, and rationale
 *
 * @example
 * const result = await classifyTime("Companies founded in the last 6 months");
 * console.log(result.start);  // "2024-05-25" (6 months ago)
 * console.log(result.end);    // "2024-11-25" (today)
 * console.log(result.confidence);  // 0.9
 */
export async function classifyTime(
  query: string,
  model: string = "gpt-4o-mini",
  minConfidence: number = 0.6
): Promise<TimeClassification> {
  try {
    // Step 1: Initialize OpenAI client
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY environment variable not set");
    }

    const client = new OpenAI({ apiKey });

    // Step 2: Create JSON schema for structured output
    const schema = {
      type: "object",
      properties: {
        start: {
          type: "string",
          description: "Start date in ISO format (YYYY-MM-DD)",
        },
        end: {
          type: "string",
          description: "End date in ISO format (YYYY-MM-DD)",
        },
        confidence: {
          type: "number",
          minimum: 0.0,
          maximum: 1.0,
          description: "Confidence score between 0 and 1",
        },
        rationale: {
          type: "string",
          description: "Brief explanation for the date range extraction",
        },
      },
      required: ["start", "end", "confidence", "rationale"],
      additionalProperties: false,
    };

    // Step 3: Prepare context for the AI
    const today = getCurrentDate();
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    const systemPrompt = `You are a time range extraction expert.

Your task: Extract the start and end dates for the time period mentioned in the user's query.

Current context:
- Today's date: ${today}
- Current year: ${currentYear}
- Current month: ${currentMonth}

Guidelines:
- Extract the time range that the user is asking about
- Return dates in ISO format (YYYY-MM-DD)
- Common expressions:
  * "last 6 months" → start: 6 months ago, end: today
  * "past year" → start: 1 year ago, end: today
  * "in 2024" → start: 2024-01-01, end: 2024-12-31
  * "Q1 2024" → start: 2024-01-01, end: 2024-03-31
  * "recent" or "lately" → start: 3 months ago, end: today
  * "this month" → start: first day of current month, end: today
  * "January to March 2023" → start: 2023-01-01, end: 2023-03-31
- Provide a confidence score (0-1) based on how clear the time range is
- If no specific time range is mentioned, default to last 12 months with low confidence
- Give a brief rationale explaining your date extraction

Remember: Extract the TIME PERIOD the user is asking about, not when they're asking the question.`;

    // Step 4: Call OpenAI with structured output
    const response = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: query },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "time_classification",
          strict: true,
          schema,
        },
      },
      temperature: 0.1, // Low temperature for more consistent extraction
    });

    // Step 5: Parse the response
    const result = response.choices[0].message.content;
    if (!result) {
      throw new Error("No response from OpenAI");
    }

    const classificationData = JSON.parse(result);
    const classification = TimeClassificationSchema.parse(classificationData);

    // Step 6: Handle low confidence - fallback to last 12 months
    if (classification.confidence < minConfidence) {
      const defaultStart = getDateYearsAgo(1);
      const defaultEnd = getCurrentDate();

      console.warn(
        `Low confidence (${classification.confidence.toFixed(2)}) for time range, ` +
        `using default: last 12 months (${defaultStart} to ${defaultEnd})`
      );

      return {
        start: defaultStart,
        end: defaultEnd,
        confidence: 0.5,
        rationale: `Original extraction uncertain (confidence ${classification.confidence.toFixed(2)}). ` +
          `Defaulting to last 12 months.`,
      };
    }

    console.log(
      `Extracted time range: ${classification.start} to ${classification.end} ` +
      `(confidence: ${classification.confidence.toFixed(2)})`
    );

    return classification;

  } catch (error) {
    console.error("Error classifying time range:", error);

    // Return default time range on error (last 12 months)
    const defaultStart = getDateYearsAgo(1);
    const defaultEnd = getCurrentDate();

    return {
      start: defaultStart,
      end: defaultEnd,
      confidence: 0.0,
      rationale: `Error during classification: ${error instanceof Error ? error.message : String(error)}. Using default range (last 12 months).`,
    };
  }
}

// ===============================
// TESTING
// ===============================

if (require.main === module) {
  console.log("\n=== Time Classification Agent Test ===\n");

  const testQueries = [
    "Show me companies from the last 6 months",
    "Who funded startups in 2024?",
    "Companies founded in the past year",
    "Recent fintech investments",
    "Companies from Q1 2024",
    "Startups founded between January and March 2023",
  ];

  (async () => {
    for (const query of testQueries) {
      console.log(`\nQuery: ${query}`);
      try {
        const result = await classifyTime(query);
        console.log(`  Start: ${result.start}`);
        console.log(`  End: ${result.end}`);
        console.log(`  Confidence: ${result.confidence.toFixed(2)}`);
        console.log(`  Rationale: ${result.rationale}`);
      } catch (error) {
        console.error(`  Error: ${error}`);
      }
    }
    console.log("\n=== Test Complete ===\n");
  })();
}
