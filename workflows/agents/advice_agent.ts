import { RagResearchAgent } from './rag_research_agent';

export interface AdviceResponse {
  investors: string[];
  companies: string[];
  query: string;
}

export async function getAdvice(query: string): Promise<AdviceResponse> {
  const ragAgent = new RagResearchAgent();
  await ragAgent.connect();

  const results = await ragAgent.testVectorSearch(query);

  const investors: string[] = [];
  const companies: string[] = [];

  for (const result of results) {
    if (result.company_name) {
      companies.push(result.company_name);
    }
    if (result.investors && Array.isArray(result.investors)) {
      investors.push(...result.investors);
    }
  }

  // Remove duplicates
  const uniqueInvestors = [...new Set(investors)];
  const uniqueCompanies = [...new Set(companies)];

  return {
    investors: uniqueInvestors,
    companies: uniqueCompanies,
    query
  };
}
