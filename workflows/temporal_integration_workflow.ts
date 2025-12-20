import { Agent, run } from "@openai/agents";
import OpenAI from "openai";
import { z } from "zod";
import { getTemporal, type ResponseItem } from "./agents/temporal_agent";
import type { TimeClassification } from "./agents/time_agent";
import { classifyTime } from "./agents/time_agent"; //time_router_agent

const openai = new OpenAI();

// --- Zod Schema ---
const TemporalflowOutputSchema = z
  .object({
    timeResults: z.object({
      start: z.string().describe("Start date in ISO format (YYYY-MM-DD)"),
      end: z.string().describe("End date in ISO format (YYYY-MM-DD)"),
    }),
    temporalResults: z.object({
      companies: z.array(z.string()),
      inference: z.string(),
    }),
    summarizeAndDisplayResult: z.object({
      inference_summary: z.string(),
    }),
  })
  .optional();

// --- Types ---
type WorkflowInput = {
  input_as_text: string;
};

export type TemporalOutput = {
  time: TimeClassification | null;
  results: ResponseItem | null;
};

export type SummarizeResults = {
  inference_summary: string;
};

// --- Schema for Summarize Output ---
const SummarizeResultsSchema = z.object({
  inference_summary: z
    .string()
    .describe("A concise summary of the inference analysis"),
});

// --- Summarize and Display Agent ---
export const summarizeAndDisplay = new Agent({
  name: "Summarize and Display",
  instructions: `You are a summarization agent. You will receive a detailed inference analysis about company trends and funding patterns.

Your task is to:
1. Read the inference carefully
2. Extract the key insights and main points
3. Provide a concise, clear summary that highlights:
   - Main trends identified
   - Key industries or sectors mentioned
   - Notable funding patterns
   - Important conclusions

Keep your summary brief but informative, focusing on the most important takeaways.`,
  model: "gpt-4o",
  outputType: SummarizeResultsSchema,
  modelSettings: { store: true },
});

/**
 * getSummary
 * Calls the summarizeAndDisplay agent to summarize the inference
 * @param inference - The detailed inference text to summarize
 * @returns SummarizeResults - Object containing the inference_summary
 */
export async function getSummary(inference: string): Promise<SummarizeResults> {
  const prompt = `Please summarize the following inference analysis:\n\n${inference}`;

  const result = await run(summarizeAndDisplay, prompt);

  if (!result.finalOutput) {
    throw new Error("Summarization failed: no output received");
  }

  return {
    inference_summary: result.finalOutput.inference_summary,
  };
}

// --- Main Function ---
/**
 * temporalIntent
 * @param input_text string
 * @returns TemporalOutput
 */
export async function temporalIntent(
  input_text: string
): Promise<TemporalOutput> {
  // Build the workflow input
  const workflowInput: WorkflowInput = {
    input_as_text: input_text,
  };

  // 1. Get time classification
  const timeResult: TimeClassification | null = await classifyTime(
    workflowInput.input_as_text
  );

  if (!timeResult) {
    return {
      time: null,
      results: null,
    };
  }

  const { start, end } = timeResult;

  // 2. Get temporal/company flow data
  const temporalResult: ResponseItem = await getTemporal(
    workflowInput.input_as_text,
    start,
    end
  );

  // 3. Summarize the inference from the temporal results
  const summaryResult: SummarizeResults = await getSummary(
    temporalResult.inference
  );
  //update the TemporalResult by overwrtiing the inference object with summarize result
  temporalResult.inference = summaryResult.inference_summary;
  console.log("=== Inference Summary ===");
  console.log(summaryResult.inference_summary);
  console.log("========================");

  // 4. Return combined workflow output
  return {
    time: timeResult,
    results: temporalResult,
  };
}
