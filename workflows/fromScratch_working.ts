//in this file we want to have a getTime method
//we want to have a data struct for time
//we want to return the the time
//in the orchastrator, discconect the existintg temproal workf low and conncect this one
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), "../.env") });

import { END, StateGraph } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";

const TimeClassificationSchema = z.object({
  start: z
    .number()
    .describe("Start date as Unix timestamp (seconds since epoch)"),
  end: z.number().describe("End date as Unix timestamp (seconds since epoch)"),
  confidence: z.number().min(0).max(1),
  rationale: z.string(),
});

export type TimeClassification = z.infer<typeof TimeClassificationSchema>;

type TimeRange = {
  start: number;
  stop: number;
};

interface GraphState {
  query: string;
  model: string;
  timeRange: TimeRange;
}

const graph = new StateGraph<GraphState>({
  channels: {
    query: {
      value: (left?: string, right?: string) => right ?? left ?? "",
      default: () => "",
    },
    model: {
      value: (left?: string, right?: string) => right ?? left ?? "",
      default: () => "",
    },
    timeRange: {
      value: (left?: TimeRange, right?: TimeRange) =>
        right ?? left ?? { start: 0, stop: 0 },
      default: () => ({ start: 0, stop: 0 }),
    },
  },
});

function buildSystemPrompt(): string {
  const now = new Date();
  const todayUtc = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      0,
      0,
      0,
      0
    )
  );

  return `
You are a time range extraction engine.

Your task:
- Extract the time range implied by the user's query.
- Return a Unix timestamp range in SECONDS.
- Use UTC time only.

Rules:
- "today" means from 00:00:00 UTC today until now.
- "yesterday" means from 00:00:00 UTC yesterday until 23:59:59 UTC yesterday.
- If a specific date is mentioned, infer the full day unless otherwise specified.
- If no time range is implied, return today's range with low confidence.

Output requirements:
- You MUST return valid JSON that matches the provided schema.
- Do NOT include any extra text or explanation outside the JSON.
- The confidence field reflects how certain the time interpretation is (0–1).
- The rationale briefly explains how the time was inferred.

Current UTC date:
${todayUtc.toISOString()}
`.trim();
}

//createLLM helper function to instantiate the llm
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

/*
 * extractTime range is the function that provides the unix start / unix stop
 * @params state {}
 * @returns non (updates state start, stop})
 */
async function extractTimeRange(state: {
  model: string;
  query: string;
}): Promise<{
  timeRange: {
    start: number;
    stop: number;
  };
}> {
  const llm = createLlm(state.model);

  // Use withStructuredOutput to get parsed JSON
  const structuredLlm = llm.withStructuredOutput(TimeClassificationSchema);

  const response = await structuredLlm.invoke([
    { role: "system", content: buildSystemPrompt() },
    { role: "user", content: state.query },
  ]);

  // Extract start and end from response and map to start/stop
  return {
    timeRange: {
      start: response.start,
      stop: response.end,
    },
  };
}

graph
  .addNode("extractTime", extractTimeRange)
  .addEdge("extractTime", END)
  .setEntryPoint("extractTime");

/*
.addNode("temporalAgent", temporalAgent)
.addEdge("extractTime", "temporalAgent")
.addEdge("temporalAgent", END)
*/

const app = graph.compile();

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
    });

    // Get the LLM response by running extraction
    const llm = createLlm(model);
    const structuredLlm = llm.withStructuredOutput(TimeClassificationSchema);

    const response = await structuredLlm.invoke([
      { role: "system", content: buildSystemPrompt() },
      { role: "user", content: query },
    ]);

    // Check confidence and apply fallback if needed
    if (response.confidence >= minConfidence) {
      return response;
    }

    // Fallback to last 12 months if confidence too low
    const now = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(now.getFullYear() - 1);

    return {
      start: Math.floor(oneYearAgo.getTime() / 1000),
      end: Math.floor(now.getTime() / 1000),
      confidence: 0.5,
      rationale: `Confidence too low (${response.confidence.toFixed(2)}). Defaulted to last 12 months.`,
    };
  } catch (err) {
    console.error("Error classifying time:", err);

    // Default fallback (last 12 months)
    const now = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(now.getFullYear() - 1);

    return {
      start: Math.floor(oneYearAgo.getTime() / 1000),
      end: Math.floor(now.getTime() / 1000),
      confidence: 0,
      rationale:
        "Fatal error during classification; defaulting to last 12 months.",
    };
  }
}

// =========================================================
// MAIN EXECUTION
// =========================================================

if (require.main === module) {
  (async () => {
    console.log("\n=== Time Extraction Test ===");
    const output = await classifyTime("who was funded today", "gpt-4o-mini");

    console.log("\nQuery: who was funded today");
    console.log("Result:", output);
    console.log("\n=== Test Complete ===\n");
  })();
}

/*
 * classifyTime - returns the struct
 * @oaram state -- langgraph object
 * @returns time TimeStruct

export async function classifyTime(): Promise<TimeClassification> {
  const result: TimeClassification = {};


  return result;

}
*/
