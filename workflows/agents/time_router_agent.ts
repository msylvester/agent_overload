/**
 * Time Range Classification Agent — LangGraph Version
 */

import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import { END, StateGraph } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";

// =========================================================
// SCHEMA
// =========================================================

const TimeClassificationSchema = z.object({
  start: z
    .number()
    .describe("Start date as Unix timestamp (seconds since epoch)"),
  end: z.number().describe("End date as Unix timestamp (seconds since epoch)"),
  confidence: z.number().min(0).max(1),
  rationale: z.string(),
});

export type TimeClassification = z.infer<typeof TimeClassificationSchema>;

// =========================================================
// DATE HELPERS
// =========================================================

function getCurrentTimestamp(): number {
  return Math.floor(Date.now() / 1000);
}

function getTimestampMonthsAgo(months: number): number {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return Math.floor(d.getTime() / 1000);
}

function getTimestampYearsAgo(years: number): number {
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  return Math.floor(d.getTime() / 1000);
}

function getTimestampDaysAgo(days: number): number {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return Math.floor(d.getTime() / 1000);
}

function getStartOfWeek(): number {
  const d = new Date();
  const day = d.getUTCDay(); // 0 = Sunday, 1 = Monday, etc.
  const diff = day === 0 ? 6 : day - 1; // Treat Monday as start of week
  const startOfWeek = new Date(
    Date.UTC(
      d.getUTCFullYear(),
      d.getUTCMonth(),
      d.getUTCDate() - diff,
      0,
      0,
      0,
      0
    )
  );
  return Math.floor(startOfWeek.getTime() / 1000);
}

function getStartOfLastWeek(): number {
  const d = new Date();
  const day = d.getUTCDay();
  const diff = day === 0 ? 6 : day - 1;
  const startOfLastWeek = new Date(
    Date.UTC(
      d.getUTCFullYear(),
      d.getUTCMonth(),
      d.getUTCDate() - diff - 7,
      0,
      0,
      0,
      0
    )
  );
  return Math.floor(startOfLastWeek.getTime() / 1000);
}

function getEndOfLastWeek(): number {
  const d = new Date();
  const day = d.getUTCDay();
  const diff = day === 0 ? 6 : day - 1;
  const endOfLastWeek = new Date(
    Date.UTC(
      d.getUTCFullYear(),
      d.getUTCMonth(),
      d.getUTCDate() - diff - 1,
      23,
      59,
      59,
      999
    )
  );
  return Math.floor(endOfLastWeek.getTime() / 1000);
}

// =========================================================
// LLM (OpenRouter)
// =========================================================

function createLlm(model: string) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY not set");

  return new ChatOpenAI({
    apiKey,
    temperature: 0.1,
    model,
    configuration: { baseURL: "https://openrouter.ai/api/v1" },
  });
}

// =========================================================
// SYSTEM PROMPT BUILDER
// =========================================================

function buildSystemPrompt() {
  const today = new Date().toISOString().split("T")[0];
  const todayTimestamp = getCurrentTimestamp();
  const year = new Date().getUTCFullYear();
  const month = new Date().getUTCMonth() + 1;

  // Pre-calculated reference points
  const startOfWeek = getStartOfWeek();
  const startOfLastWeek = getStartOfLastWeek();
  const endOfLastWeek = getEndOfLastWeek();
  const sevenDaysAgo = getTimestampDaysAgo(7);

  // Get day of week
  const dayOfWeek = new Date().getUTCDay();
  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  return `
You are a time range extraction expert.

Your task: Extract the start and end dates for the time period mentioned in the user's query.

Current context:
- Today's date: ${today}
- Today's day: ${dayNames[dayOfWeek]}
- Today's Unix timestamp: ${todayTimestamp}
- Current year: ${year}
- Current month: ${month}

IMPORTANT - Pre-calculated reference timestamps (USE THESE DIRECTLY):
- Start of this week (Monday 00:00 UTC): ${startOfWeek}
- Start of last week (Monday 00:00 UTC): ${startOfLastWeek}
- End of last week (Sunday 23:59 UTC): ${endOfLastWeek}
- 7 days ago from now: ${sevenDaysAgo}

FOR SPECIFIC MONTH/YEAR QUERIES - Use these exact timestamps:
- January 2025: 1735689600 to 1738367999
- February 2025: 1738368000 to 1740786399
- March 2025: 1740787200 to 1743465599
- April 2025: 1743465600 to 1746057599
- May 2025: 1746057600 to 1748735999
- June 2025: 1748736000 to 1751327999
- July 2025: 1751328000 to 1754006399
- August 2025: 1754006400 to 1756684799
- September 2025: 1756684800 to 1759276799
- October 2025: 1759276800 to 1761955199
- November 2025: 1761955200 to 1764547199
- December 2025: 1764547200 to 1767225599

Guidelines:
- Extract the specific time range referenced in the query.
- Output Unix timestamps (seconds since epoch).
- For a given date, use the start of day (00:00:00) for start timestamps and end of day (23:59:59) for end timestamps unless the query specifies otherwise.

CRITICAL INSTRUCTIONS:
- For "this week": MUST use ${startOfWeek} as start, ${todayTimestamp} as end
- For "last week" or "the last week" or "past week": MUST use ${sevenDaysAgo} to ${todayTimestamp} (7 days ago to now)
- For specific months (e.g., "September 2025", "November 2025"): Look up the EXACT timestamps from the table above
- For relative periods like "last 6 months", calculate from today's timestamp

Confidence levels:
- High confidence (0.8-1.0) when:
  • Specific months/years mentioned (e.g., "September 2025", "November 2025")
  • "this week" or "last week"
  • Clear time expressions with explicit dates
- Low confidence (0.3-0.5) when:
  • Vague terms like "recent", "today" (without specific time)

Common mappings:
  • "last week" or "the last week" or "past week" or "past 7 days" → ${sevenDaysAgo} to ${todayTimestamp}
  • "last 6 months" → 6 months ago to today
  • "past year" → 1 year ago to today
  • "in 2024" or "2024" → January 1, 2024 00:00:00 to December 31, 2024 23:59:59
  • "Q1 2024" → January 1, 2024 00:00:00 to March 31, 2024 23:59:59
  • "recent" → last 3 months
  • "this month" → first day of month to today
  • "today" → start of today to current time

Provide:
- start: Unix timestamp (seconds since epoch)
- end: Unix timestamp (seconds since epoch)
- confidence: 0–1
- rationale: brief string

If the query is unclear, return a low-confidence answer.
`;
}

// =========================================================
// LANGGRAPH NODE — Calls the LLM
// =========================================================

async function extractionNode(state: { query: string; model: string }) {
  const llm = createLlm(state.model);

  // Use withStructuredOutput to get parsed JSON
  const structuredLlm = llm.withStructuredOutput(TimeClassificationSchema);

  const response = await structuredLlm.invoke([
    { role: "system", content: buildSystemPrompt() },
    { role: "user", content: state.query },
  ]);

  return { extracted: response };
}

// =========================================================
// LANGGRAPH NODE — Applies fallbacks based on confidence
// =========================================================

async function postProcessNode(state: {
  extracted: TimeClassification;
  minConfidence: number;
}) {
  const { extracted, minConfidence } = state;

  if (extracted.confidence >= minConfidence) {
    return { result: extracted };
  }

  // Fallback to last 12 months
  const start = getTimestampYearsAgo(1);
  const end = getCurrentTimestamp();

  return {
    result: {
      start,
      end,
      confidence: 0.5,
      rationale: `Confidence too low (${extracted.confidence.toFixed(
        2
      )}). Defaulted to last 12 months.`,
    },
  };
}

// =========================================================
// BUILD LANGGRAPH
// =========================================================

const workflow = new StateGraph({
  channels: {
    query: z.string(),
    model: z.string(),
    minConfidence: z.number(),
    extracted: TimeClassificationSchema.nullable(),
    result: TimeClassificationSchema.nullable(),
  },
} as any)
  .addNode("extract", extractionNode)
  .addNode("postProcess", postProcessNode)
  .addEdge("extract", "postProcess")
  .addEdge("postProcess", END)
  .setEntryPoint("extract");

const app = workflow.compile();

// =========================================================
// PUBLIC API
// =========================================================

export async function classifyTime(
  query: string,
  model = "gpt-4o-mini",
  minConfidence = 0.6
): Promise<TimeClassification> {
  try {
    const result = await app.invoke({
      query,
      model,
      minConfidence,
    });

    return result.result;
  } catch (err) {
    console.error("Error classifying time:", err);

    // Default fallback (last 12 months)
    const start = getTimestampYearsAgo(1);
    const end = getCurrentTimestamp();

    return {
      start,
      end,
      confidence: 0,
      rationale:
        "Fatal error during classification; defaulting to last 12 months.",
    };
  }
}

// =========================================================
// OPTIONAL TESTING (same interface as original)
// =========================================================

if (require.main === module) {
  (async () => {
    console.log("\n=== LangGraph Time Classification Test ===");
    const queries = [
      "Show me companies from the last 6 months",
      "Who funded startups in 2024?",
      "Companies founded in the past year",
      "Recent fintech investments",
      "Companies from Q1 2024",
      "Startups founded between January and March 2023",
    ];

    for (const q of queries) {
      console.log("\nQuery:", q);
      const out = await classifyTime(q);
      console.log(out);
    }
    console.log("\n=== Test Complete ===\n");
  })();
}
