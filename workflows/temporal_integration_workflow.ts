import { Agent, run } from "@openai/agents";
import { z } from "zod";
import OpenAI from "openai";

import { classifyTime } from "./agents/time_agent";
import { getTemporal } from "./agents/temporal_agent";

import { ResponseItem } from "./agents/temporal_agent";
import type { TimeClassification } from "./agents/time_agent";

const openai = new OpenAI();

// --- Zod Schema ---
const TemporalflowOutputSchema = z.object({
  timeResults: z.object({
    start: z.string().describe("Start date in ISO format (YYYY-MM-DD)"),
    end: z.string().describe("End date in ISO format (YYYY-MM-DD)"),
  }),
  temporalResults: z.object({
    companies: z.array(z.string()),
    inference: z.string(),
  }),
}).optional();

// --- Types ---
type WorkflowInput = {
  input_as_text: string;
};

export type WorkflowOutput = {
  time: TimeClassification | null;
  results: TemporalflowOutput | null;
};

// --- Main Function ---
/**
 * temporalIntent
 * @param input_text string
 * @returns WorkflowOutput
 */
export async function temporalIntent(input_text: string): Promise<WorkflowOutput> {
  // Build the workflow input
  const workflowInput: WorkflowInput = {
    input_as_text: input_text,
  };

  // 1. Get time classification
  const timeResult: TimeClassification | null = await classifyTime(workflowInput.input_as_text);

  if (!timeResult) {
    return {
      time: null,
      results: null,
    };
  }

  const { start, end } = timeResult;

  // 2. Get temporal/company flow data
  const temporalResult: ResponseItem = await getTemporal(
    start,
    end,
    workflowInput.input_as_text
  );



  // 3. Return combined workflow output
  return {
    time: timeResult,
    results: temporalResult,
  };
}
