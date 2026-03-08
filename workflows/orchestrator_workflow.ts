//orch workflow
//
//
//
import { classifyIntent } from './agents/classify_agent_langgraph';
import { classifyTime } from './agentic_time_workflow';
import type { TemporalOutput } from './temporal_integration_workflow';
import { runResearchWorkflow } from './agentic_research_workflow';
import { buildTemporalClarification } from './agents/temporal_clarification_agent';
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
  options?: { skipClarification?: boolean }
): Promise<OrchFlowOutput> {
  // Step 1: Get classification
  const classification = await classifyIntent(input_text);

  // Initialize output with classification
  const output: OrchFlowOutput = {
    classifyResponse: classification.intent
  };

  // Step 2: Based on classification, run appropriate workflow
  if (classification.intent === 'time') {
    // Hard routing rule: temporal = clarify first, always
    output.has_temporal_intent = true;
    output.requires_temporal_clarification = true;

    if (!options?.skipClarification) {
      // Phase 1: return clarification buttons, STOP execution
      output.temporalClarification = buildTemporalClarification(input_text);
      return output;
    }

    // Phase 2: user already clarified, run full temporal workflow
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
