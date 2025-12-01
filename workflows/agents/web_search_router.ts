/**
 * Web Research Agent — LangGraph + Tavily (No OpenAI Agent SDK)
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') });

import { z } from "zod";
import { StateGraph, END } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { TavilyClient } from "tavily";

// ----------------------------
// SCHEMAS
// ----------------------------

const CompanyDetailsSchema = z.object({
  company_name: z.string(),
  website: z.string(),
  company_size: z.string(),
  headquarters_location: z.string(),
  founded_year: z.number(),
  industry: z.string(),
  description: z.string(),
});

const WebResearchOutputSchema = z.object({
  companies: z.array(CompanyDetailsSchema),
});

export type CompanyDetails = z.infer<typeof CompanyDetailsSchema>;
export interface WebResearchAgentOutput {
  companies: CompanyDetails[];
}

// ----------------------------
// TAVILY CLIENT
// ----------------------------

const tavily = new TavilyClient({
  apiKey: process.env.TAVILY_API_KEY!,
});

// ----------------------------
// LLM via OpenRouter
// ----------------------------

function llm() {
  return new ChatOpenAI({
    apiKey: process.env.OPENROUTER_API_KEY!,
    model: "gpt-4o",
    temperature: 0.2,
    configuration: { baseURL: "https://openrouter.ai/api/v1" },
  });
}

// ----------------------------
// NODE 1 — Call Tavily Search for Each Company
// ----------------------------

async function tavilySearchNode(state: { companyNames: string[] }) {
  const searchResults: Record<string, any[]> = {};

  for (const name of state.companyNames) {
    const tavilyResponse = await tavily.search({
      query: `${name} company profile website employees headquarters industry`,
      max_results: 8,
    });

    searchResults[name] = tavilyResponse.results;
  }

  return { searchResults };
}

// ----------------------------
// NODE 2 — LLM Extracts the Structured Company Objects
// ----------------------------

async function llmExtractionNode(state: {
  companyNames: string[];
  searchResults: Record<string, any[]>;
}) {
  const prompt = `
You are an expert business analyst.

You are given real web search results for companies.  
Your task is to extract structured company profiles for EACH company.

Extract the following for each company:
- company_name (use exact string provided)
- website (official homepage)
- company_size ("10-50", "100-500", "1000+", etc.)
- headquarters_location (City, Country)
- founded_year
- industry
- description (2–3 sentences)

Web Search Results (JSON):
${JSON.stringify(state.searchResults, null, 2)}

Return JSON matching this schema:
${WebResearchOutputSchema.toString()}
`;

  const response = await llm().invoke(
    [
      { role: "system", content: "Extract structured company intelligence." },
      { role: "user", content: prompt },
    ],
    {
      response_format: zodResponseFormat(
        WebResearchOutputSchema,
        "web_research"
      ),
    }
  );

  // Parse the JSON response from the message content
  const parsedResponse = JSON.parse(response.content as string);

  return {
    companies: parsedResponse.companies,
  };
}

// ----------------------------
// BUILD WORKFLOW
// ----------------------------

const workflow = new StateGraph({
  channels: {
    companyNames: z.array(z.string()),
    searchResults: z.record(z.array(z.any())),
    companies: z.array(CompanyDetailsSchema),
  },
})
  .addNode("search", tavilySearchNode)
  .addNode("extract", llmExtractionNode)

  // *** IMPORTANT: explicit START node ***
  .addEdge("__start__", "search")
  .addEdge("search", "extract")
  .addEdge("extract", END);

const app = workflow.compile();

// ----------------------------
// PUBLIC API
// ----------------------------

export async function researchCompanies(
  companyNames: string[]
): Promise<WebResearchAgentOutput> {
  const result = await app.invoke({ companyNames });

  return {
    companies: result.companies,
  };
}

export type { WebResearchAgentOutput, CompanyDetails };

