import dotenv from "dotenv";
import path from "path";

// Load environment variables before any other imports
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { Agent, run, tool } from "@openai/agents";
import type { Collection } from "mongodb";
import { z } from "zod";
import { getMongoClient } from "../mongoPool";

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
  limit = 40
): Promise<{ companies: string[]; details: any[] }> {
  const client = await getMongoClient();
  const collection: Collection = client
    .db("companies")
    .collection("funded_companies");

  try {
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);

    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      throw new Error(
        `Invalid date format. Expected ISO strings (YYYY-MM-DD). Got: start=${startDate}, end=${endDate}`
      );
    }

    if (startDateObj > endDateObj) {
      throw new Error(
        `Start date (${startDate}) cannot be after end date (${endDate})`
      );
    }

    const now = endDateObj;

    const query: any = {
      created_at: { $gte: startDateObj, $lte: now },
    };

    if (domain) {
      query.$and = [
        { created_at: { $gte: startDateObj, $lte: now } },
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
    return { companies: [], details: [] };
  }
}

// Define the temporal search tool
const temporalSearchTool = tool({
  name: "temporalSearch",
  description:
    "Search for companies based on funding announcement date (article date) or database creation date within a specific time period",
  parameters: z.object({
    start_date: z
      .string()
      .describe(
        "Start date in ISO format (YYYY-MM-DD). Companies with funding announcements or database records on or after this date will be included."
      ),
    end_date: z
      .string()
      .describe(
        "End date in ISO format (YYYY-MM-DD). Companies with funding announcements or database records on or before this date will be included."
      ),
    domain: z
      .string()
      .describe(
        "Optional domain/industry to filter by (e.g., 'AI', 'fintech', 'healthcare'). Leave empty string if not filtering by domain."
      )
      .default(""),
    limit: z
      .number()
      .describe("Maximum number of companies to return")
      .default(40),
  }),
  execute: async (input) => {
    const domain =
      input.domain && input.domain.trim() !== "" ? input.domain : undefined;
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
// UPDATED TEMPORAL AGENT
// ===============================

const temporal_agent = new Agent({
  name: "Temporal Trend Analyzer",
  instructions: `
You are a trend spotting agent that analyzes companies and market movements within specific time periods using a MongoDB database of funded companies.

You will receive a query and a pair of dates (start_date and end_date).

Your core responsibilities:
1. Always call the temporalSearch tool using the provided start_date and end_date.
2. Retrieve companies and their metadata.
3. Produce trend analysis describing:
   - Common industries gaining traction
   - Emerging technologies
   - Funding patterns and notable investors
   - Geographic patterns
   - Themes in company descriptions

--------------------------------------------------
ADDITIONAL BEHAVIOR FOR INDUSTRY-LEVEL FUNDING QUESTIONS
--------------------------------------------------

If the user asks anything involving:
- "what industry received the most funding"
- "top funded industry"
- "which sector had the highest funding"
- "industry with most investment"
- or similar comparative funding questions

You MUST:

1. Call the temporalSearch tool with the provided start and end date.
2. Retrieve all company metadata including:
   - sector/industry
   - funding_amount
   - total_funding
3. Aggregate funding totals by industry:
   - Prefer total_funding when available
   - If missing, fallback to funding_amount
   - If both missing, treat as 0
4. Determine:
   - The top-funded industry
   - Ranked list of industries by total funding
   - Key companies contributing to these totals
5. Include this result in the 'inference' field.

--------------------------------------------------
OUTPUT FORMAT
--------------------------------------------------

Your final JSON MUST match the TemporalAnalysisSchema:
{
  companies: string[],   // All companies returned by the tool
  inference: string      // Detailed trend analysis + industry funding results (if applicable)
}

Be highly specific, cite examples, include funding patterns, and reference the time window (e.g. "Between April 2024 and June 2024...").
`,
  model: "gpt-4o",
  outputType: TemporalAnalysisSchema,
  tools: [temporalSearchTool],
  modelSettings: { store: true },
});

// ===============================
// EXPORT FUNCTION
// ===============================

export async function getTemporal(
  inputText: string,
  startDate: string,
  endDate: string
): Promise<ResponseItem> {
  if (!startDate || !endDate) {
    throw new Error("start_date and end_date are required parameters");
  }

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
