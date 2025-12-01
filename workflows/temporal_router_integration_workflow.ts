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
    return { results: null };
  }

  const { start, end } = state.time;

  const temporalResults = await getTemporal(state.inputText, start, end);

  return { results: temporalResults };
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
      ),
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
// Build LangGraph Workflow
// ----------------------------

const workflow = new StateGraph({
  channels: {
    inputText: "string",
    time: z.any().nullable(),
    results: z.any().nullable(),
  },
})
  .addNode("timeExtractor", timeNode)
  .addNode("temporalAnalysis", temporalNode)
  .addNode("summarizer", summaryNode)
  .addEdge(START, "timeExtractor")
  .addEdge("timeExtractor", "temporalAnalysis")
  .addEdge("temporalAnalysis", "summarizer")
  .addEdge("summarizer", END);

const app = workflow.compile();

// ----------------------------
// PUBLIC API — same signature as original
// ----------------------------

export async function temporalIntent(
  input_text: string
) {
  const result = await app.invoke({
    inputText: input_text,
  });

  return {
    time: result.time,
    results: result.results,
  };
}
