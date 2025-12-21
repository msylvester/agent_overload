/**
 * Unified Temporal Intent Pipeline — LangGraph Version
 */

import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { z } from "zod";
import { StateGraph, START, END } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { zodResponseFormat } from "openai/helpers/zod";

import { classifyTime } from "./agents/time_router_agent";
import { getTemporal } from "./agents/temporal_router_agent";
import { logger } from "@/lib/logger";

// ----------------------------
// OUTPUT SCHEMA
// ----------------------------

const WorkflowOutputSchema = z.object({
  time: z.object({
    start: z.string(),
    end: z.string(),
    confidence: z.number(),
    rationale: z.string()
  }).nullable(),
  results: z.object({
    companies: z.array(z.string()),
    inference: z.string()
  }).nullable(),
});

// ----------------------------
// Summarization Schema
// ----------------------------

const SummarizeResultsSchema = z.object({
  inference_summary: z.string(),
});

// ----------------------------
// Validation Schemas
// ----------------------------

const TimestampValidationSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
  startTimestamp: z.number(),
  endTimestamp: z.number(),
  isValid: z.boolean(),
  validationErrors: z.array(z.string()),
});

const VerificationResultSchema = z.object({
  isValid: z.boolean(),
  errors: z.array(z.string()),
  warnings: z.array(z.string()),
});

// ----------------------------
// LLM (OpenRouter)
// ----------------------------

function llm(model: string = "gpt-4o") {
  return new ChatOpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    model,
    temperature: 0.0,
    configuration: { baseURL: "https://openrouter.ai/api/v1" },
  });
}

// ----------------------------
// Timestamp Validation Helper
// ----------------------------

function validateTimestamps(
  start: number,
  end: number
): { isValid: boolean; errors: string[]; startDate: string; endDate: string } {
  const errors: string[] = [];

  // Convert to dates
  const startDate = new Date(start * 1000);
  const endDate = new Date(end * 1000);

  // Validation 1: Check if timestamps are valid numbers
  if (isNaN(start) || isNaN(end)) {
    errors.push("Invalid timestamp: start or end is NaN");
  }

  // Validation 2: Check if dates are valid
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    errors.push(
      `Invalid date conversion: start=${start}, end=${end}, ` +
      `startDate=${startDate}, endDate=${endDate}`
    );
  }

  // Validation 3: Check if start < end
  if (startDate >= endDate) {
    errors.push(
      `Start date (${startDate.toISOString()}) must be before ` +
      `end date (${endDate.toISOString()})`
    );
  }

  // Validation 4: Check reasonable date range (not before 1970 or too far in future)
  const MIN_TIMESTAMP = 0; // Jan 1, 1970
  const MAX_TIMESTAMP = 4102444800; // Jan 1, 2100

  if (start < MIN_TIMESTAMP || start > MAX_TIMESTAMP) {
    errors.push(
      `Start timestamp ${start} (${startDate.toISOString()}) is outside ` +
      `reasonable range (1970-2100)`
    );
  }

  if (end < MIN_TIMESTAMP || end > MAX_TIMESTAMP) {
    errors.push(
      `End timestamp ${end} (${endDate.toISOString()}) is outside ` +
      `reasonable range (1970-2100)`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  };
}

// ----------------------------
// Node 1 — Time Classification
// ----------------------------

async function timeNode(state: { inputText: string }) {
  const result = await classifyTime(state.inputText);

  return { time: result };
}

// ----------------------------
// Node 2 — Temporal Search + Trend Analysis
// ----------------------------

async function temporalNode(state: {
  inputText: string;
  time: any;
}) {
  if (!state.time) {
    logger.warn("⚠️ No time classification found - returning null results");
    return { results: null, validationErrors: ["No time classification provided"] };
  }

  const { start, end } = state.time;

  // CRITICAL: Validate timestamp conversion before proceeding
  const validation = validateTimestamps(start, end);

  if (!validation.isValid) {
    logger.error("❌ Timestamp validation failed:", validation.errors);
    return {
      results: null,
      validationErrors: validation.errors
    };
  }

  logger.log(
    `✓ Timestamp validation passed: ${validation.startDate} to ${validation.endDate}`
  );

  const temporalResults = await getTemporal(
    state.inputText,
    validation.startDate,
    validation.endDate
  );

  return {
    results: temporalResults,
    validationErrors: []
  };
}

// ----------------------------
// Node 3 — Summarization
// ----------------------------

async function summaryNode(state: {
  results: { companies: string[]; inference: string } | null;
}) {
  if (!state.results) {
    return { results: null };
  }

  const summarizePrompt = `
Please summarize the following inference analysis into a concise conclusion:

${state.results.inference}
  `;

  const response = await llm("gpt-4o").invoke(
    [
      { role: "system", content: "You are a concise summarization agent." },
      { role: "user", content: summarizePrompt },
    ],
    {
      response_format: zodResponseFormat(
        SummarizeResultsSchema,
        "summarize_results"
      ) as any,
    }
  );

  // Replace inference text with summary
  const parsedContent = JSON.parse(response.content as string);
  return {
    results: {
      ...state.results,
      inference: parsedContent.inference_summary,
    },
  };
}

// ----------------------------
// Node 4 — Final Verification
// ----------------------------

async function verificationNode(state: {
  time: any;
  results: { companies: string[]; inference: string } | null;
  validationErrors?: string[];
}) {
  const errors: string[] = [...(state.validationErrors || [])];
  const warnings: string[] = [];

  // Verification 1: Check if we have time classification
  if (!state.time) {
    errors.push("Missing time classification in final output");
  } else {
    // Verify time fields are reasonable
    if (state.time.confidence < 0.3) {
      warnings.push(
        `Low confidence time extraction (${state.time.confidence.toFixed(2)})`
      );
    }
  }

  // Verification 2: Check if we have results
  if (!state.results) {
    errors.push("No temporal results found - workflow returned null");
  } else {
    // Verify results content
    if (!state.results.companies || state.results.companies.length === 0) {
      warnings.push("No companies found in temporal search results");
    }

    if (!state.results.inference || state.results.inference.trim().length === 0) {
      errors.push("Inference summary is empty or missing");
    }

    // Verify inference quality (basic checks)
    if (state.results.inference && state.results.inference.length < 50) {
      warnings.push(
        `Inference summary is very short (${state.results.inference.length} chars) - ` +
        `may be incomplete`
      );
    }
  }

  // Verification 3: Check workflow state consistency
  if (state.time && !state.results) {
    errors.push(
      "Inconsistent state: time classification succeeded but temporal search failed"
    );
  }

  const isValid = errors.length === 0;

  if (!isValid) {
    logger.error("❌ Final verification failed:");
    errors.forEach(e => logger.error(`  - ${e}`));
  }

  if (warnings.length > 0) {
    logger.warn("⚠️ Verification warnings:");
    warnings.forEach(w => logger.warn(`  - ${w}`));
  }

  if (isValid && warnings.length === 0) {
    logger.log("✓ Final verification passed");
  }

  return {
    verificationResult: {
      isValid,
      errors,
      warnings,
    },
  };
}

// ----------------------------
// Build LangGraph Workflow
// ----------------------------

const workflow = new StateGraph({
  channels: {
    inputText: z.string(),
    time: z.any().nullable(),
    results: z.any().nullable(),
    validationErrors: z.any().nullable(),
    verificationResult: z.any().nullable(),
  },
} as any)
  .addNode("timeExtractor", timeNode)
  .addNode("temporalAnalysis", temporalNode)
  .addNode("summarizer", summaryNode)
  .addNode("verification", verificationNode)
  .addEdge(START, "timeExtractor")
  .addEdge("timeExtractor", "temporalAnalysis")
  .addEdge("temporalAnalysis", "summarizer")
  .addEdge("summarizer", "verification")
  .addEdge("verification", END);

const app = workflow.compile();

// Export for Mermaid diagram generation
export { app };

// ----------------------------
// PUBLIC API — same signature as original
// ----------------------------

export async function temporalIntent(
  input_text: string
) {
  const result = await app.invoke({
    inputText: input_text,
  });

  // Check verification results
  const verification = result.verificationResult as { isValid: boolean; errors: string[]; warnings: string[] } | null;

  if (verification && !verification.isValid) {
    logger.error("❌ Workflow verification failed:");
    verification.errors.forEach((e: string) =>
      logger.error(`  - ${e}`)
    );

    // Fail-fast strategy: throw error to force caller to handle
    throw new Error(
      `Temporal workflow verification failed: ${verification.errors.join('; ')}`
    );
  }

  // Log warnings even if verification passed
  if (verification && verification.warnings.length > 0) {
    logger.warn("⚠️ Verification warnings (non-blocking):");
    verification.warnings.forEach((w: string) =>
      logger.warn(`  - ${w}`)
    );
  }

  return {
    time: result.time,
    results: result.results,
    verificationResult: result.verificationResult,
  };
}
