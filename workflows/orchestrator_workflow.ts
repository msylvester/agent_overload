//orch workflow
//
//
//
import { classifyIntent } from './agents/classify_agent_langgraph';
import { classifyTime } from './fromScratch';
import type { TemporalOutput } from './temporal_integration_workflow';
import { runResearchWorkflow } from './agentic_research_workflow';

export interface OrchFlowOutput {
  classifyResponse?: 'time' | 'basic' | 'research' | 'advice';
  basicResponse?: string;
  temporalResponse?: TemporalOutput;
  ragResults?: string;
}

async function runOrchestratorWorkflow(input_text: string): Promise<OrchFlowOutput> {
  // Step 1: Get classification
  const classification = await classifyIntent(input_text);

  // Initialize output with classification
  const output: OrchFlowOutput = {
    classifyResponse: classification.intent
  };

  // Step 2: Based on classification, run appropriate workflow
  if (classification.intent === 'time') {
    // Run temporal workflow for time-based queries using fromScratch.ts
    const result = await classifyTime(input_text);
    const temporalResponse: TemporalOutput = {
      time: result.timeClassification,
      results: result.results
    };
    output.temporalResponse = temporalResponse;
  } else if (classification.intent === 'research') {
    // Run research workflow for research queries
    const researchResult = await runResearchWorkflow(input_text, 'research');
    output.ragResults = researchResult.ragResults;
  } else if (classification.intent === 'basic') {
    // Generate basic response for simple queries
    const basicResult = await runResearchWorkflow(input_text, 'basic');
    output.basicResponse = basicResult.basicResponse;
  }

  return output;
}

export { runOrchestratorWorkflow };
