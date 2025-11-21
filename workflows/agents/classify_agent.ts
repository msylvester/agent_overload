import { Agent, run } from "@openai/agents";
import { z } from "zod";

interface IntentClassificationSchema {
  intent: "advice" | "research";
  reasoning: string;
}

const IntentSchema = z.object({
  intent: z.enum(["advice", "research"]),
  reasoning: z.string(),
});

const intent_classifier_agent = new Agent({
  name: "Intent classifier",
  instructions: `
You are an intent classifier. Analyze the user's query and determine if they are asking for:
- "advice": seeking recommendations, guidance, or how-to information
- "research": requesting factual information, data, or research about a topic

Provide your classification with reasoning.
  `,
  model: "gpt-4o-mini",
  outputType: IntentSchema,
});

export async function classifyIntent(query: string): Promise<IntentClassificationSchema> {
  const result = await run(intent_classifier_agent, query);

  if (!result.finalOutput) {
    throw new Error("Intent classification failed: no output received");
  }

  return {
    intent: result.finalOutput.intent,
    reasoning: result.finalOutput.reasoning,
  };
}

