import { Agent, run, webSearchTool } from "@openai/agents";
import { z } from "zod";

// Schema for company details
const CompanyDetailsSchema = z.object({
  company_name: z.string(),
  website: z.string(),
  company_size: z.string(),
  headquarters_location: z.string(),
  founded_year: z.number(),
  industry: z.string(),
  description: z.string(),
});

// Schema for web research agent output - use array instead of record
const WebResearchOutputSchema = z.object({
  companies: z.array(CompanyDetailsSchema),
});

interface CompanyDetails {
  company_name: string;
  website: string;
  company_size: string;
  headquarters_location: string;
  founded_year: number;
  industry: string;
  description: string;
}

interface WebResearchAgentOutput {
  companies: CompanyDetails[];
}

const webResearchAgent = new Agent({
  name: "Web Research Agent",
  instructions: `You are a web research agent that gathers detailed information about companies using web search.

For each company provided, use the web search tool to find:
- Company name (exact as provided)
- Official website URL
- Company size (number of employees, e.g., "10-50", "100-500", "1000+")
- Headquarters location (City, Country)
- Year the company was founded (as a number)
- Industry classification
- Brief description of what the company does

Search for recent, accurate information from reliable sources. Prioritize official company websites,
LinkedIn, Crunchbase, and reputable business news sources.

Output format: Return an array of company objects.

Example output structure:
{
  "companies": [
    {
      "company_name": "Company Name Here",
      "website": "https://...",
      "company_size": "10-50",
      "headquarters_location": "City, Country",
      "founded_year": 2020,
      "industry": "Technology",
      "description": "Brief description..."
    }
  ]
}

Focus on finding accurate, up-to-date information. Search for each company individually to get the most accurate results.`,
  model: "gpt-4o-mini", // Faster and cheaper, sufficient for web research
  outputType: WebResearchOutputSchema,
  tools: [webSearchTool()],
  modelSettings: {
    store: true,
  },
});

async function researchCompanies(
  companyNames: string[]
): Promise<WebResearchAgentOutput> {
  const companiesPrompt = `Research the following companies and provide detailed information for each:

Companies: ${companyNames.join(", ")}

For each company, provide:
- company_name: The exact company name
- website: Official website URL
- company_size: Number of employees (e.g., "10-50", "100-500", "1000+")
- headquarters_location: City, Country
- founded_year: Year founded (as a number)
- industry: Industry classification
- description: Brief description of what the company does

Return an array with one entry per company.`;

  const result = await run(webResearchAgent, companiesPrompt);

  if (!result.finalOutput) {
    throw new Error("Web research failed: no output received");
  }

  return {
    companies: result.finalOutput.companies,
  };
}

export { researchCompanies };
export type { WebResearchAgentOutput, CompanyDetails };
