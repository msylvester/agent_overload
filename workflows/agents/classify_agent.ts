import { Agent, run } from "@openai/agents";
import { z } from "zod";

interface IntentClassificationSchema {
  intent: "basic" | "research";
  reasoning: string;
}

const IntentSchema = z.object({
  intent: z.enum(["basic", "research"]),
  reasoning: z.string(),
});

const intent_classifier_agent = new Agent({
  name: "Intent classifier",
  instructions: `
You are an intent classifier. Analyze the user's query and classify it as one of the following:

- "research": Use ONLY when the user wants to:
  1. Look up factual data about a specific company (funding, news, financials, products, leadership)
  2. Find/discover companies in a specific domain, sector, or technology area (e.g., "ai speech translation", "cybersecurity startups", "fintech companies")
  3. Get recent news, funding rounds, or market data that requires external lookup

- "basic": Use for everything else, including:
  - General advice or strategy questions (e.g., "How should I pitch my startup?", "What investors would be interested in my product?")
  - Brainstorming or creative requests (e.g., "Help me brainstorm SaaS ideas", "Generate a tagline")
  - Explanations or how-to questions (e.g., "Explain how to validate an MVP", "How do I improve retention?")
  - Writing tasks (e.g., "Write a pitch deck outline")

Key rule: Only classify as "research" if the query requires fetching real-world data about companies or finding companies in a space. Questions asking for advice, strategies, explanations, or creative output are always "basic".

Provide your classification along with brief reasoning.
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

