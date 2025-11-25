import dotenv from 'dotenv';
import path from 'path';
// Load environment variables before any other imports
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { Agent, run, tool } from "@openai/agents";
import { z } from "zod";
import { getMongoClient } from "../mongoPool";
import { Collection } from "mongodb";

// Schema for temporal analysis output
const TemporalAnalysisSchema = z.object({
  companies: z.array(z.string()),
  inference: z.string(),
});

export interface ResponseItem {
  companies: string[];
  inference: string;
}

// ===============================
// TEMPORAL SEARCH TOOL
// ===============================

/**
 * Get recent companies from MongoDB based on funding activity or founding date
 */
async function getRecentCompanies(
  startDate: string,
  endDate: string,
  domain?: string,
  limit: number = 40
): Promise<{ companies: string[]; details: any[] }> {
  const client = await getMongoClient();
  const collection: Collection = client.db("companies").collection("funded_companies");

  try {
    // Validate and convert ISO date strings to Date objects
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);

    // Validate dates
    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      throw new Error(`Invalid date format. Expected ISO strings (YYYY-MM-DD). Got: start=${startDate}, end=${endDate}`);
    }

    if (startDateObj > endDateObj) {
      throw new Error(`Start date (${startDate}) cannot be after end date (${endDate})`);
    }

    const now = endDateObj; // Use endDate as the upper bound

    // Build query using actual MongoDB field names
    // Note: 'date' is the article publication date (funding announcement date)
    // 'created_at' is when the record was added to the database
    const query: any = {
      $or: [
        { date: { $gte: startDateObj, $lte: now } },
        { created_at: { $gte: startDateObj, $lte: now } },
      ],
    };

    // Add domain filter if provided
    if (domain) {
      query.$and = [
        { $or: query.$or },
        {
          $or: [
            { description: { $regex: domain, $options: "i" } },
            { industry: { $regex: domain, $options: "i" } },
            { company_name: { $regex: domain, $options: "i" } },
          ],
        },
      ];
      delete query.$or;
    }

    const results = await collection
      .find(query)
      .sort({ date: -1, created_at: -1 })
      .limit(limit)
      .toArray();

    return {
      companies: results.map((r) => r.company_name || "Unknown"),
      details: results.map((r) => ({
        company_name: r.company_name,
        date: r.date,
        created_at: r.created_at,
        founded_year: r.founded_year,
        description: r.description,
        sector: r.sector,
        funding_amount: r.funding_amount,
        series: r.series,
        total_funding: r.total_funding,
        investors: r.investors,
      })),
    };
  } catch (error) {
    console.error("Error in getRecentCompanies:", error);
    return {
      companies: [],
      details: [],
    };
  }
}

// Define the temporal search tool
const temporalSearchTool = tool({
  name: "temporalSearch",
  description: "Search for companies based on funding announcement date (article date) or database creation date within a specific time period",
  parameters: z.object({
    start_date: z.string().describe("Start date in ISO format (YYYY-MM-DD). Companies with funding announcements or database records on or after this date will be included."),
    end_date: z.string().describe("End date in ISO format (YYYY-MM-DD). Companies with funding announcements or database records on or before this date will be included."),
    domain: z.string().describe("Optional domain/industry to filter by (e.g., 'AI', 'fintech', 'healthcare'). Leave empty string if not filtering by domain.").default(""),
    limit: z.number().describe("Maximum number of companies to return").default(40),
  }),
  execute: async (input) => {
    const domain = input.domain && input.domain.trim() !== "" ? input.domain : undefined;
    const result = await getRecentCompanies(
      input.start_date,
      input.end_date,
      domain,
      input.limit ?? 40
    );
    return JSON.stringify(result);
  },
});

// ===============================
// TEMPORAL AGENT
// ===============================

const temporal_agent = new Agent({
  name: "Temporal Trend Analyzer",
  instructions: `
You are a trend spotting agent that analyzes companies and market trends within specific time periods using a MongoDB database of funded companies.

You will receive a query along with pre-computed start and end dates for analysis.

Your task is to:
1. Use the temporalSearch tool with the provided start_date and end_date from the user's input to find companies that were founded or received funding during that specific time period
2. Analyze the companies and identify trends such as:
   - Common industries or sectors gaining traction
   - Emerging technologies or product categories
   - Geographic patterns in company formation
   - Funding patterns and investor interest areas
   - Key themes across company descriptions

Search Strategy:
- Extract the start_date and end_date from the input context provided
- Use the temporalSearch tool with these exact dates
- If the user mentions a specific domain (e.g., "AI companies"), include it in the domain parameter
- The data contains funding announcements from news articles with their publication dates
- Look at article dates (funding announcement dates), company descriptions, and sectors to identify patterns

Output Requirements:
- companies: Array of company names that fit the temporal criteria (return all companies found, up to 40)
- inference: A detailed analysis of the trends you've identified, including:
  - What patterns emerged across these companies
  - Key themes or technologies gaining traction in this time period
  - Market dynamics or shifts observed
  - Notable insights about the direction of the industry/sector
  - Specific examples from the companies you found
  - Reference to the time period analyzed (e.g., "Between January 2024 and March 2024...")

Be specific and data-driven in your analysis. Reference specific company activities and patterns.
  `,
  model: "gpt-4o",
  outputType: TemporalAnalysisSchema,
  tools: [temporalSearchTool],
  modelSettings: {
    store: true,
  },
});

// ===============================
// EXPORT FUNCTION
// ===============================

export async function getTemporal(
  inputText: string,
  startDate: string,
  endDate: string
): Promise<ResponseItem> {
  // Validate inputs
  if (!startDate || !endDate) {
    throw new Error("start_date and end_date are required parameters");
  }

  // Enrich the input with date context for the agent
  const enrichedInput = `
Analyze companies and trends for the following query using the specified time period.

Query: ${inputText}

Time Period to Analyze:
- Start Date: ${startDate}
- End Date: ${endDate}

Use these exact dates when calling the temporalSearch tool.
`.trim();

  const result = await run(temporal_agent, enrichedInput);

  if (!result.finalOutput) {
    throw new Error("Temporal analysis failed: no output received");
  }

  return {
    companies: result.finalOutput.companies,
    inference: result.finalOutput.inference,
  };
}
