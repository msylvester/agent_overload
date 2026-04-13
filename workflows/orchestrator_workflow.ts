//orch workflow
//
//
//
import { classifyIntent } from './agents/classify_agent_langgraph';
import type { TemporalOutput } from './temporal_integration_workflow';
import { runResearchWorkflow } from './agentic_research_workflow';
import type { TemporalClarificationData } from '@/lib/types';

export interface OrchFlowOutput {
  classifyResponse?: 'time' | 'basic' | 'research' | 'advice';
  has_temporal_intent?: boolean;
  requires_temporal_clarification?: boolean;
  basicResponse?: string;
  temporalResponse?: TemporalOutput;
  ragResults?: string;
  temporalClarification?: TemporalClarificationData;
}

async function runOrchestratorWorkflow(
  input_text: string,
  options?: { skipClarification?: boolean; dateRange?: { start: string; end: string } }
): Promise<OrchFlowOutput> {
  // Step 1: Get classification
  const classification = await classifyIntent(input_text);

  // Initialize output with classification
  const output: OrchFlowOutput = {
    classifyResponse: classification.intent
  };

  // Step 2: Based on classification, run appropriate workflow
  if (classification.intent === 'time') {
    // Temporal agent is currently unavailable — short-circuit without
    // running clarification, classifyTime, or getTemporal. The route
    // handler surfaces the unavailable notice to the user.
    output.has_temporal_intent = true;
    return output;
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
