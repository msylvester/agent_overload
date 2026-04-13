/**
 * Temporal Trend Analyzer — LangGraph Version
 */

import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { z } from "zod";
import { Collection } from "mongodb";
import { getMongoClient } from "../mongoPool";

import { StateGraph, START, END } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { zodResponseFormat } from "openai/helpers/zod";

// ============================================================
// SCHEMA
// ============================================================

const TemporalAnalysisSchema = z.object({
  companies: z.array(z.string()),
  inference: z.string(),
});

export interface ResponseItem {
  companies: string[];
  inference: string;
}

// ============================================================
// TOOL EQUIVALENT: Mongo Temporal Search
// (kept exactly same logic as original)
// ============================================================

async function getRecentCompanies(
  startDate: string,
  endDate: string,
  domain?: string,
  limit: number = 200
): Promise<{ companies: string[]; details: any[] }> {
  const client = await getMongoClient();
  const collection: Collection = client
    .db("companies")
    .collection("funded_companies");

  try {
    const startStr = startDate; // already "YYYY-MM-DD"
    const endStr = endDate;

    const dateCondition = {
      $or: [
        { posted_date: { $gte: startStr, $lte: endStr } },
        { source: "TechCrunch", date: { $gte: startStr, $lte: endStr } },
      ],
    };

    let query: any = dateCondition;

    if (domain && domain.trim() !== "") {
      query = {
        $and: [
          dateCondition,
          {
            $or: [
              { description: { $regex: domain, $options: "i" } },
              { industry: { $regex: domain, $options: "i" } },
              { company_name: { $regex: domain, $options: "i" } },
            ],
          },
        ],
      };
    }

    const results = await collection
      .find(query)
      .sort({ date: -1, created_at: -1 })
      .limit(limit)
      .toArray();

    return {
      companies: results.map((r) => r.company_name ?? "Unknown"),
      details: results.map((r) => ({
        company_name: r.company_name,
        posted_date: r.posted_date,
        source: r.source,
        date: r.date,
        created_at: r.created_at,
        founded_year: r.founded_year,
        // Truncate description to avoid the LLM pulling long article prose
        // fragments into the analysis output.
        description:
          typeof r.description === "string"
            ? r.description.slice(0, 280)
            : r.description,
        sector: r.sector,
        funding_amount: r.funding_amount,
        total_funding: r.total_funding,
        investors: r.investors,
      })),
    };
  } catch (e) {
    console.error("Error getRecentCompanies:", e);
    return { companies: [], details: [] };
  }
}

// ============================================================
// LLM (OpenRouter)
// ============================================================

function createLlm(model: string) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY missing");

  return new ChatOpenAI({
    apiKey,
    model,
    temperature: 0,
    configuration: {
      baseURL: "https://openrouter.ai/api/v1",
    },
  });
}

// ============================================================
// NODE 1 — Tool Invocation Node
// (LangGraph replacement for `temporalSearchTool`)
// ============================================================

async function temporalSearchNode(state: {
  query: string;
  startDate: string;
  endDate: string;
  domain?: string;
  limit?: number;
}) {
  const { startDate, endDate, domain, limit } = state;

  const result = await getRecentCompanies(
    startDate,
    endDate,
    domain ?? "",
    limit ?? 200
  );

  return { toolResult: result };
}

// ============================================================
// NODE 2 — Analysis Node (LLM)
// ============================================================

async function analysisNode(state: {
  query: string;
  startDate: string;
  endDate: string;
  toolResult: { companies: string[]; details: any[] };
  model: string;
}) {
  const llm = createLlm(state.model);

  const { companies, details } = state.toolResult;

  // If the Mongo search returned nothing, skip the LLM call entirely.
  if (!companies || companies.length === 0) {
    return {
      result: {
        companies: [],
        inference: `No companies found in the database for the window ${state.startDate} to ${state.endDate}.`,
      },
    };
  }

  const systemPrompt = `
You are a trend-spotting agent analyzing companies within a time period.

You will be given a list of companies that were funded in a date window.
Your ONLY job is to produce a concise "inference" string summarizing
trends across those companies — do NOT invent, filter, or rewrite the
company list. The "companies" field in your output must be ignored by
the caller, so you may leave it empty.

Guidelines for the inference:
- Highlight industries gaining traction, emerging tech, funding patterns,
  geography patterns, and themes in descriptions.
- If the query compares industries by funding, aggregate by sector and
  call out the top-funded sectors with examples.
- Always reference the date window (${state.startDate} to ${state.endDate}).

OUTPUT FORMAT (STRICT):
{
  companies: string[],  // leave empty — caller supplies the real list
  inference: string
}
`;

  const userPrompt = `
User Query:
${state.query}

Companies Returned (${companies.length} total):
${JSON.stringify(details, null, 2)}

Produce the inference summary.
`;

  let inference = "";
  try {
    const response = await llm.invoke(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      {
        response_format: zodResponseFormat(
          TemporalAnalysisSchema,
          "temporal_analysis"
        ) as any,
      }
    );

    const parsedContent = JSON.parse(response.content as string);
    inference = parsedContent?.inference ?? "";
  } catch (e) {
    console.error("Error in analysisNode LLM call:", e);
    inference = `Found ${companies.length} companies between ${state.startDate} and ${state.endDate}.`;
  }

  // Authoritative: companies come straight from the Mongo result, never
  // from the LLM. The LLM only contributes the prose inference.
  return {
    result: {
      companies,
      inference,
    },
  };
}

// ============================================================
// BUILD LANGGRAPH WORKFLOW
// ============================================================

const workflow = new StateGraph({
  channels: {
    query: z.string(),
    startDate: z.string(),
    endDate: z.string(),
    domain: z.string(),
    limit: z.number(),
    model: z.string(),

    toolResult: z.object({
      companies: z.array(z.string()),
      details: z.array(z.any()),
    }).nullable(),

    result: TemporalAnalysisSchema.nullable(),
  },
} as any)
  .addNode("search", temporalSearchNode)
  .addNode("analyze", analysisNode)
  .addEdge(START, "search")
  .addEdge("search", "analyze")
  .addEdge("analyze", END);

const app = workflow.compile();

// Export the compiled graph for Mermaid diagram generation
export { app };

// ============================================================
// PUBLIC API — same external signature as original
// ============================================================

export async function getTemporal(
  inputText: string,
  startDate: string,
  endDate: string,
  domain: string = "",
  limit: number = 200,
  model: string = "gpt-4o"
): Promise<ResponseItem> {
  const res = await app.invoke({
    query: inputText,
    startDate,
    endDate,
    domain,
    limit,
    model,
  });

  // analysisNode now writes `result.companies` directly from the Mongo
  // result (state.toolResult.companies), so `res.result.companies` is the
  // authoritative DB list, not an LLM-filtered subset.
  return {
    companies: res.result?.companies ?? [],
    inference: res.result?.inference ?? "",
  };
}

