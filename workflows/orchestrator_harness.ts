//
import { classifyIntent } from "./agents/classify_agent";
import type { OrchFlowOutput } from "./orchestrator_workflow";
import { runOrchestratorWorkflow } from "./orchestrator_workflow";
import { runResearchWorkflow, type WorkflowOutput } from "./research_workflow";
import type { TemporalOutput } from "./temporal_integration_workflow";
import { temporalIntent } from "./temporal_integration_workflow";

//
//import the research_workflow
//import zod
//import the temporal_workfow
//
//data structures
//
//TEST_DATA
//
const TEST_DATA = [
  {
    input: "Who was funded in December",
    min_expected: 14,
  }
  //   {
  //     input: "who has been funded in the lsat week",
  //     min_expected: 1
  //   }, {
  //     input: "who has been funded in the last month",
  //     min_expected: 12,
  //   },
  //   {
  //     input: "who has been funded in the last 14 days",
  //     min_expected: 14,
  //   },
  //   {
  //     input: "any companies that are food trucks",
  //     min_expected: 1
  //  },  {
  //    input: "any companies that do speech translation",
  //     min_expected: 1
  //  }
];
//response result
//
//
//
interface Result {
  input: string;
  expected: number;
  status: boolean;
  classification?: string;
  rag_results?: WorkflowOutput;
}

async function orchestrator(): Promise<Result[]> {
  //get the result from the classifier
  //
  const results = [];

  for (const test of TEST_DATA) {
    const { input, min_expected } = test;
    //get the results
    const orch_result: OrchFlowOutput = await runOrchestratorWorkflow(input);
    //decconstruct the resutls as they exist plust the classicaiton

    //determine what the result is and deal with it
    if (orch_result.classifyResponse === "time") {
      //run temporal workflow
      const temporal_result: TemporalOutput | undefined =
        orch_result.temporalResponse;

      if (temporal_result?.results?.companies?.length >= min_expected) {
        results.push({
          input,
          expected: min_expected,
          status: true,
        });
        continue;
      }

      results.push({
        input,
        expected: min_expected,
        status: false,
      });
      continue;
    }
    if (orch_result.classifyResponse === "research") {
      if (orch_result.ragResults) {
        const companies = orch_result.ragResults.sources.map(
          (s) => s.companyName
        );
        if (companies.length >= min_expected) {
          results.push({
            input,
            expected: min_expected,
            status: true,
          });
          continue;
        }
        results.push({
          input,
          expected: min_expected,
          status: false,
        });
        continue;
      }
    } else if (orch_result.classifyResponse === "basic") {
      // For basic responses, we just check if we got a response
      if (orch_result.basicResponse) {
        results.push({
          input,
          expected: min_expected,
          status: true,
        });
        continue;
      }
      results.push({
        input,
        expected: min_expected,
        status: false,
      });
      continue;
    }

    // If we reach here, something went wrong
    results.push({
      input,
      expected: min_expected,
      status: false,
    });
  }
  return results;
}
(async () => {
  try {
    const results = await orchestrator();
    console.log("Orchestrator results:", JSON.stringify(results, null, 2));
  } catch (e) {
    console.log(`Error executing the workflow: ${e}`);
  }
})();
