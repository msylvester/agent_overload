/**
 * Time Range Classification Agent — LangGraph Version
 */

import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), "../.env.local") });

import { z } from "zod";
import { ChatOpenAI } from "@langchain/openai";
import { StateGraph, END } from "@langchain/langgraph";

// =========================================================
// SCHEMA
// =========================================================

const TimeClassificationSchema = z.object({
  start: z.string().describe("Start date in ISO format (YYYY-MM-DD)"),
  end: z.string().describe("End date in ISO format (YYYY-MM-DD)"),
  confidence: z.number().min(0).max(1),
  rationale: z.string(),
});

export type TimeClassification = z.infer<typeof TimeClassificationSchema>;

// =========================================================
// DATE HELPERS
// =========================================================

function getCurrentDate(): string {
  return new Date().toISOString().split("T")[0];
}

function getDateMonthsAgo(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return d.toISOString().split("T")[0];
}

function getDateYearsAgo(years: number): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  return d.toISOString().split("T")[0];
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
  const today = getCurrentDate();
  const year = new Date().getFullYear();
  const month = new Date().getMonth() + 1;

  return `
You are a time range extraction expert.

Your task: Extract the start and end dates for the time period mentioned in the user's query.

Current context:
- Today's date: ${today}
- Current year: ${year}
- Current month: ${month}

Guidelines:
- Extract the specific time range referenced in the query.
- Output ISO 8601 dates (YYYY-MM-DD).
- Be confident (0.8+) when years are explicitly mentioned (like "2024", "2023", "in 2024")
- Be confident (0.9+) when quarters or specific months are mentioned
- Common mappings:
  • "last 6 months" → 6 months ago to today
  • "past year" → 1 year ago to today
  • "in 2024" or "2024" → 2024-01-01 to 2024-12-31 (high confidence)
  • "Q1 2024" → 2024-01-01 to 2024-03-31
  • "recent" → last 3 months
  • "this month" → first day of month to today
  • "January to March 2023" → 2023-01-01 to 2023-03-31

Provide:
- start: ISO date
- end: ISO date
- confidence: 0–1 (use high values 0.8-1.0 for clear time expressions)
- rationale: brief string

If the query is unclear, return a low-confidence answer.
`;
}

// =========================================================
// LANGGRAPH NODE — Calls the LLM
// =========================================================

async function extractionNode(state: {
  query: string;
  model: string;
}) {
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

async function postProcessNode(
  state: {
    extracted: TimeClassification;
    minConfidence: number;
  }
) {
  const { extracted, minConfidence } = state;

  if (extracted.confidence >= minConfidence) {
    return { result: extracted };
  }

  // Fallback to last 12 months
  const start = getDateYearsAgo(1);
  const end = getCurrentDate();

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
    query: "string",
    model: "string",
    minConfidence: "number",
    extracted: TimeClassificationSchema,
    result: TimeClassificationSchema,
  },
})
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
  model: string = "gpt-4o-mini",
  minConfidence: number = 0.6
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
    const start = getDateYearsAgo(1);
    const end = getCurrentDate();

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

