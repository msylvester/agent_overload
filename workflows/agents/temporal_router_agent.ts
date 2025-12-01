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
  limit: number = 40
): Promise<{ companies: string[]; details: any[] }> {
  const client = await getMongoClient();
  const collection: Collection = client
    .db("companies")
    .collection("funded_companies");

  try {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error(`Invalid start/end date`);
    }

    const query: any = {
      created_at: { $gte: start, $lte: end },
    };

    if (domain && domain.trim() !== "") {
      query.$and = [
        { created_at: { $gte: start, $lte: end } },
        {
          $or: [
            { description: { $regex: domain, $options: "i" } },
            { industry: { $regex: domain, $options: "i" } },
            { company_name: { $regex: domain, $options: "i" } },
          ],
        },
      ];
      delete query.created_at;
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
        date: r.date,
        created_at: r.created_at,
        founded_year: r.founded_year,
        description: r.description,
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
    limit ?? 40
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

  const systemPrompt = `
You are a trend-spotting agent analyzing companies within a time period.

Your goals:
1. Perform trend analysis:
   - industries gaining traction
   - emerging tech
   - funding patterns
   - geography patterns
   - themes in descriptions
2. If the query involves comparing industries by funding:
   - Aggregate funding by sector
   - Identify the top-funded sectors
   - Provide examples and reasoning
3. Always reference the date window (${state.startDate} to ${state.endDate})

OUTPUT FORMAT (STRICT):
{
  companies: string[],
  inference: string
}
`;

  const userPrompt = `
User Query:
${state.query}

Companies Returned:
${JSON.stringify(details, null, 2)}

Extract trends and produce final analysis.
`;

  const response = await llm.invoke(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    {
      response_format: zodResponseFormat(
        TemporalAnalysisSchema,
        "temporal_analysis"
      ),
    }
  );

  // Parse the JSON response from the content
  const parsedContent = JSON.parse(response.content as string);

  return { result: parsedContent };
}

// ============================================================
// BUILD LANGGRAPH WORKFLOW
// ============================================================

const workflow = new StateGraph({
  channels: {
    query: "string",
    startDate: "string",
    endDate: "string",
    domain: "string",
    limit: "number",
    model: "string",

    toolResult: z.object({
      companies: z.array(z.string()),
      details: z.array(z.any()),
    }),

    result: TemporalAnalysisSchema,
  },
})
  .addNode("search", temporalSearchNode)
  .addNode("analyze", analysisNode)
  .addEdge(START, "search")
  .addEdge("search", "analyze")
  .addEdge("analyze", END);

const app = workflow.compile();

// ============================================================
// PUBLIC API — same external signature as original
// ============================================================

export async function getTemporal(
  inputText: string,
  startDate: string,
  endDate: string,
  domain: string = "",
  limit: number = 40,
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

  return {
    companies: res.result.companies,
    inference: res.result.inference,
  };
}

