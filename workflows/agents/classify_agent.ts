import { Agent, run } from "@openai/agents";
import { z } from "zod";

interface IntentClassificationSchema {
  intent: "basic" | "research" | "time";
  reasoning: string;
}

const IntentSchema = z.object({
  intent: z.enum(["basic", "research", "time"]),
  reasoning: z.string(),
});

const intent_classifier_agent = new Agent({
  name: "Intent classifier",
  instructions: `
You are an intent classifier. Analyze the user's query and classify it as one of the following:

CLASSIFICATION PRIORITY:
1. Check for "time" first - if query has temporal constraints, classify as "time"
2. Then check for "research" - if query needs company lookup without time constraints
3. Default to "basic" for everything else

- "time": Use when the query involves temporal/time-based requirements (HIGHEST PRIORITY):
  - Queries with specific time periods, dates, or date ranges
    Examples: "Who has been funded in 2024", "companies funded in the last month", "startups from last week", "Q1 2024 funding", "companies founded in 2020"
  - Questions about historical trends or time-series data
    Examples: "funding trends over the past year", "growth in the last 6 months"
  - Any request that requires filtering or analyzing data by time
  - Keywords to watch for: "in [year]", "last [time period]", "past [time period]", "since [date]", "during [time]", "between [dates]", "recently", "this quarter/year/month"

  CRITICAL: If a query asks "who/which/what companies" AND includes a time constraint (like "in 2024", "last month", "past week"), it is ALWAYS "time", not "research".

- "research": Use ONLY when the user wants to look up data WITHOUT time constraints:
  1. Look up factual data about a SPECIFIC named company (e.g., "Research Tesla", "Tell me about SpaceX funding", "Latest news about OpenAI")
  2. Find/discover companies in a specific domain or sector WITHOUT time constraints (e.g., "cybersecurity startups", "fintech companies in Europe", "AI companies")
  3. Get current/recent news or market data about specific entities

  DO NOT use "research" if the query has ANY temporal constraint - those should be "time".

- "basic": Use for everything else, including:
  - General advice or strategy questions (e.g., "How should I pitch my startup?", "What investors would be interested in my product?")
  - Brainstorming or creative requests (e.g., "Help me brainstorm SaaS ideas", "Generate a tagline")
  - Explanations or how-to questions (e.g., "Explain how to validate an MVP", "How do I improve retention?")
  - Writing tasks (e.g., "Write a pitch deck outline")

KEY RULES:
1. Time constraints ALWAYS take precedence - "Who has been funded in 2024" is "time", not "research"
2. Named companies without time = "research" (e.g., "Research Tesla")
3. Time-based company queries = "time" (e.g., "Companies funded last month")

Provide your classification along with brief reasoning.
  `,
  model: "gpt-4o-mini",
  outputType: IntentSchema,
});

export async function classifyIntent(
  query: string
): Promise<IntentClassificationSchema> {
  const result = await run(intent_classifier_agent, query);

  if (!result.finalOutput) {
    throw new Error("Intent classification failed: no output received");
  }

  return {
    intent: result.finalOutput.intent,
    reasoning: result.finalOutput.reasoning,
  };
}
