//Give the agent a bunch of companies and get search results
//
import 'dotenv/config';
import { researchCompanies } from './agents/web_search_router';

type Company = {
  company_name: string,
}

//
//
interface SearchResult {
  industry: string;
  company_name: string;
  founded?: string;
  website: string;
  company_size?: string;
  description: string;
}

const TEST_DATA_NAMES = ['Lovable', 'Cursor'];

const TEST_DATA = [
  {
    "name": "Lovable",
    "industry": "Software",
    "founded": 2023,
    "headquarters": "Stockholm, Sweden",
    "company_size": 45,
    "website": "https://lovable.dev",
    "description": "Lovable is a Swedish tech company that provides an AI software engineering platform for building websites and applications from natural language. Founded in December 2023 by Anton Osika and Fabian Hedin, the company launched into general availability in November 2024. By July 2025, Lovable reported surpassing $100M in annual recurring revenue and raised $200M in a Series A round led by Accel at a $1.8B valuation."
  },
  {
    "name": "Cursor",
    "industry": "Digital Agency",
    "founded": 2017,
    "headquarters": "United Kingdom",
    "company_size": "100+",
    "website": "https://cursor.co.uk",
    "description": "Cursor is a digital agency specializing in creating robust systems for education and membership organizations. They focus on securely managing sensitive data to enhance organizational efficiency and member experiences. Their services include bespoke digital solutions tailored to the unique needs of each client."
  }
];

//use the web research method to get results
async function web_search_harness(): Promise<SearchResult[]> {
  //use the agent to produce the results
  const agentOutput = await researchCompanies(TEST_DATA_NAMES);

  console.log('Agent output:', JSON.stringify(agentOutput, null, 2));

  // Transform the output to match SearchResult format
  const results: SearchResult[] = agentOutput.companies.map(details => ({
    company_name: details.company_name,
    industry: details.industry,
    founded: details.founded_year.toString(),
    website: details.website,
    company_size: details.company_size,
    description: details.description,
  }));

  return results;
}

(async () => {
  try {
    const results = await web_search_harness();
    for (let i=0; i < results.length; i++) {
      const { name } = TEST_DATA[i];
      const { company_name } = results[i];
      //ignore case 
      if (name.toLowerCase() === company_name.toLowerCase()) {
        console.log(`success because ${name} matches ${company_name}`);
        continue;
      }
      console.log(`${name} failed to match ${company_name}`)




    }
    console.log('Search Results:', JSON.stringify(results, null, 2));
  } catch (error) {
    console.error('Error running web search harness:', error);
  }
})();


