//orch workflow
//
//
//
import { classifyIntent } from './agents/classify_agent_langgraph';
import { temporalIntent } from './temporal_router_integration_workflow';
import type { TemporalOutput } from './temporal_router_integration_workflow';
import { runResearchWorkflow } from './research_workflow';
import type { RAGQueryResponse } from './rag_router_agent';
import type { WebResearchAgentOutput } from './agents/web_search_router';

type WebResearchOutput = WebResearchAgentOutput;

export interface OrchFlowOutput {
  classifyResponse?: 'time' | 'basic' | 'research';
  basicResponse?: string;
  temporalResponse?: TemporalOutput;
  ragResults?: RAGQueryResponse;
  webResults?: WebResearchOutput;
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
    // Run temporal workflow for time-based queries
    const temporalResponse = await temporalIntent(input_text);
    output.temporalResponse = temporalResponse;
  } else if (classification.intent === 'research') {
    // Run research workflow for research queries
    const researchResult = await runResearchWorkflow(input_text, 'research');
    output.ragResults = researchResult.ragResults;
    output.webResults = researchResult.webResults;
  } else if (classification.intent === 'basic') {
    // Generate basic response for simple queries
    const basicResult = await runResearchWorkflow(input_text, 'basic');
    output.basicResponse = basicResult.basicResponse;
  }

  return output;
}

export { runOrchestratorWorkflow };
export type { WebResearchOutput };
