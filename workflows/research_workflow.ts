import { Agent, run } from "@openai/agents";
import { z } from "zod";
import OpenAI from "openai";
//import { classifyIntent } from './agents/classify_agent';
import { researchCompanies, WebResearchAgentOutput } from "./agents/web_search_agent";
import { runRagQuery, RAGQueryResponse } from "./rag_service";
import { temporalIntent } from './temporal_integration_workflow';
import type { TemporalOutput } from './temporal_integration_workflow';

const openai = new OpenAI();

// ===============================
// SCHEMAS
// ===============================

const RagCompanySchema = z.object({
  companyName: z.string(),
  relevanceScore: z.number(),
  documentSnippet: z.string(),
});

const WorkflowOutputSchema = z.object({
  basicResponse: z.string().optional(),
  ragResults: z.object({
    answer: z.string(),
    sources: z.array(RagCompanySchema),
    confidenceScore: z.number(),
    reasoning: z.string(),
  }),
  webResults: z.object({
    companies: z.array(z.object({
      company_name: z.string(),
      website: z.string(),
      company_size: z.string(),
      headquarters_location: z.string(),
      founded_year: z.number(),
      industry: z.string(),
      description: z.string(),
    })),
  }).optional(),
});

// ===============================
// TYPES
// ===============================

type WorkflowInput = {
  input_as_text: string;
};

type WorkflowOutput = {
  basicResponse?: string;
  /*
  temporalResponse?: TemporalOutput;
  */
  ragResults?: RAGQueryResponse;
  webResults?: WebResearchAgentOutput;
};

// ===============================
// BASIC RESPONSE
// ===============================

async function generateBasicResponse(query: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are a helpful startup and business advisor. Provide clear, actionable advice.
Keep responses concise but informative. Focus on practical guidance.`,
      },
      {
        role: "user",
        content: query,
      },
    ],
    temperature: 0.7,
    max_tokens: 1000,
  });

  return response.choices[0]?.message?.content || "Unable to generate response.";
}

// ===============================
// WORKFLOW
// ===============================

async function runResearchWorkflow(inputText: string, intent: string): Promise<WorkflowOutput> {


  const workflowInput: WorkflowInput = {
    input_as_text: inputText,
  };

  //const classificationResult = await classifyIntent(workflowInput.input_as_text);


  // If basic intent, generate a simple response without research
  if (intent === 'basic') {
    console.log("\n💬 Basic query detected - generating direct response...");
    const basicResponse = await generateBasicResponse(workflowInput.input_as_text);
    return {
      basicResponse,
    };
  }
  //Time intent - run full temoral workflow
  if (intent === 'time') {
    console.log("🔍 Starting temporal workflow...");
    console.log(`📝 Query: ${workflowInput.input_as_text}`);

    // Step 1: Run RAG query to find relevant companies from the knowledge base
    console.log("\n📚 Running Time query ");
    const temporalResponse = await temporalIntent(workflowInput.input_as_text);

    return {
      temporalResponse,
    }

  }

  // Research intent - run full workflow
  if (intent === 'research') { 
    console.log("🔍 Starting research workflow...");
    console.log(`📝 Query: ${workflowInput.input_as_text}`);

    // Step 1: Run RAG query to find relevant companies from the knowledge base
    console.log("\n📚 Step 1: Running RAG query...");
    const ragResults = await runRagQuery(workflowInput.input_as_text);

    console.log(`✅ RAG query complete. Found ${ragResults.sources.length} sources.`);
    console.log(`📊 Confidence: ${ragResults.confidenceScore}`);

    // Extract company names from RAG results
    const companiesFromRag = ragResults.sources.map(source => source.companyName);

    const investorsFromRag = ragResults.sources.map(source => source.investors);

    console.log(`here are the investos ${investorsFromRag}`)

 

    // Step 2: If we found companies, enrich with web research
    let webResults: WebResearchAgentOutput | undefined;

    if (companiesFromRag.length > 0) {
      console.log(`\n🌐 Step 2: Running web research for ${companiesFromRag.length} companies...`);
      console.log(`   Companies: ${companiesFromRag.join(", ")}`);

      try {
        webResults = await researchCompanies(companiesFromRag);
        console.log(`✅ Web research complete. Got details for ${webResults.companies.length} companies.`);
      } catch (error) {
        console.error("⚠️ Web research failed:", error);
      }
    } else {
      console.log("\n⏭️ Skipping web research - no companies found in RAG results.");
    }

    console.log("\n✨ Research workflow complete!");
    return {
      ragResults,
      webResults,
    };
  }

  // Fallback (shouldn't reach here)
  throw new Error(`Unknown intent: ${intent}`);
}

// ===============================
// EXPORTS
// ===============================

export { runResearchWorkflow };
export type { WorkflowOutput, WorkflowInput };

// ===============================
// STANDALONE TESTING
// ===============================

if (require.main === module) {
  const testQuery = process.argv[2] || "fintech startups in Saudi Arabia";
  const testIntent = (process.argv[3] as "basic" | "research" | "time") || "research";

  console.log("=".repeat(60));
  console.log("RESEARCH WORKFLOW TEST");
  console.log("=".repeat(60));

  runResearchWorkflow(testQuery, testIntent)
    .then(result => {
      console.log("\n" + "=".repeat(60));
      console.log("RESULTS");
      console.log("=".repeat(60));

      // Handle basic response
      if (result.basicResponse) {
        console.log("\n💬 Basic Response:");
        console.log(result.basicResponse);
        return;
      }

      // Handle research response
      if (result.ragResults) {
        console.log("\n📚 RAG Answer:");
        console.log(result.ragResults.answer);

        console.log("\n📊 Sources:");
        result.ragResults.sources.forEach(source => {
          console.log(`  - ${source.companyName} (relevance: ${source.relevanceScore.toFixed(2)})`);
        });
      }

      if (result.webResults) {
        console.log("\n🌐 Web Research Results:");
        result.webResults.companies.forEach(company => {
          console.log(`  - ${company.company_name}`);
          console.log(`    Website: ${company.website}`);
          console.log(`    Size: ${company.company_size}`);
          console.log(`    Location: ${company.headquarters_location}`);
          console.log(`    Industry: ${company.industry}`);
        });
      }
    })
    .catch(error => {
      console.error("❌ Workflow failed:", error);
      process.exit(1);
    });
}
