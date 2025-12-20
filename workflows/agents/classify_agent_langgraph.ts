import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateObject } from "ai";
import { z } from "zod";

// ---------------------------------------------
// 1. Zod Schema
// ---------------------------------------------
const IntentSchema = z.object({
  intent: z.enum(["advice", "research", "time", "basic"]),
  reasoning: z.string(),
});

export type IntentClassificationSchema = z.infer<typeof IntentSchema>;

// ---------------------------------------------
// 2. OpenRouter Provider
// ---------------------------------------------
const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

// ---------------------------------------------
// 3. Function to classify intent
// ---------------------------------------------
export async function classifyIntent(
  query: string
): Promise<IntentClassificationSchema> {
  const result = await generateObject({
    model: openrouter("openai/gpt-4o-mini"),
    schema: IntentSchema,
    prompt: `You are an intent classifier. Analyze the user's query and classify it into ONE of these categories:

PRIORITY ORDER (check in this order):
1. "time": ANY query that mentions or implies a specific time period, date range, or temporal constraint
   - Keywords: "last week", "this year", "in 2024", "Q1", "since January", "past 30 days", "recently", "this month", month names (January, August, etc.)
   - Examples: "Who was funded last week", "Companies funded in August", "Which companies received funding this year"
   - NOTE: Even if asking about specific companies or requesting research, if there's a time constraint, it's "time"

2. "research": Requesting factual information about specific companies, topics, or data WITHOUT time constraints
   - Examples: "Research Tesla", "Tell me about SpaceX funding", "Find AI companies in healthcare"
   - Must be about specific entities or topics
   - No temporal constraints mentioned

3. "advice": Seeking recommendations, strategic guidance, or how-to information for the user's own situation
   - Must be asking for personalized advice or strategic recommendations
   - Examples: "What investors would be interested in my SaaS product?", "How should I approach investors?"
   - NOT for general how-to questions without personal context

4. "basic": Simple, general questions that don't fit the above categories
   - General how-to questions: "How should I pitch my AI startup?"
   - Informational queries without specific research targets
   - Questions answerable with general knowledge

User query: ${query}

Analyze the query carefully for temporal indicators. If ANY time-related word or date reference exists, classify as "time".

Return JSON that matches the required schema.`,
  });

  return result.object;
}
