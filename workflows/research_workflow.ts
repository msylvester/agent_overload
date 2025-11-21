import { Agent, run } from "@openai/agents";
import { z } from "zod";
import { researchCompanies, WebResearchAgentOutput } from "./agents/web_search_agent";
import { runRagQuery, RAGQueryResponse } from "./rag_service";

// ===============================
// SCHEMAS
// ===============================

const RagCompanySchema = z.object({
  companyName: z.string(),
  relevanceScore: z.number(),
  documentSnippet: z.string(),
});

const WorkflowOutputSchema = z.object({
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
  ragResults: RAGQueryResponse;
  webResults?: WebResearchAgentOutput;
};

// ===============================
// WORKFLOW
// ===============================

async function runResearchWorkflow(inputText: string): Promise<WorkflowOutput> {
  const workflowInput: WorkflowInput = {
    input_as_text: inputText,
  };

  console.log("🔍 Starting research workflow...");
  console.log(`📝 Query: ${workflowInput.input_as_text}`);

  // Step 1: Run RAG query to find relevant companies from the knowledge base
  console.log("\n📚 Step 1: Running RAG query...");
  const ragResults = await runRagQuery(workflowInput.input_as_text);

  console.log(`✅ RAG query complete. Found ${ragResults.sources.length} sources.`);
  console.log(`📊 Confidence: ${ragResults.confidenceScore}`);

  // Extract company names from RAG results
  const companiesFromRag = ragResults.sources.map(source => source.companyName);

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

  // Compile final results
  const output: WorkflowOutput = {
    ragResults,
    webResults,
  };

  console.log("\n✨ Research workflow complete!");
  return output;
}

// ===============================
// EXPORTS
// ===============================

export { runResearchWorkflow, WorkflowOutput, WorkflowInput };

// ===============================
// STANDALONE TESTING
// ===============================

if (require.main === module) {
  const testQuery = process.argv[2] || "fintech startups in Saudi Arabia";

  console.log("=".repeat(60));
  console.log("RESEARCH WORKFLOW TEST");
  console.log("=".repeat(60));

  runResearchWorkflow(testQuery)
    .then(result => {
      console.log("\n" + "=".repeat(60));
      console.log("RESULTS");
      console.log("=".repeat(60));

      console.log("\n📚 RAG Answer:");
      console.log(result.ragResults.answer);

      console.log("\n📊 Sources:");
      result.ragResults.sources.forEach(source => {
        console.log(`  - ${source.companyName} (relevance: ${source.relevanceScore.toFixed(2)})`);
      });

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
