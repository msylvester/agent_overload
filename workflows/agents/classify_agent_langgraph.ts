import { z } from "zod";
import { generateObject } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

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
    prompt: `You are an intent classifier. Analyze the user's query and determine if they are asking for:
- "advice": seeking recommendations, guidance, or how-to information
- "research": requesting factual information, data, or research about a specific topic/company
- "time": queries about funding events or activities within a specific time period (e.g., "last week", "in 2024", "Q1")
- "basic": simple questions that can be answered with existing knowledge

User query: ${query}

Return JSON that matches the required schema.`,
  });

  return result.object;
}
