interface ClassificationResult {
  is_funding: boolean;
  confidence: number;
  reason: string;
}

interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

/**
 * Check if article title indicates funding news using AI
 * @param title - The article title to analyze
 * @param openrouterApiKey - Optional API key, defaults to OPENROUTER_API_KEY env var
 * @returns true if funding article, false if not, null if AI is unavailable or error occurs
 */
export async function isFundingArticleAI(
  title: string,
  openrouterApiKey?: string
): Promise<boolean | null> {
  const apiKey = openrouterApiKey ?? process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return null; // Return null to indicate AI is not available
  }

  try {
    const prompt = `Is this article title about company funding or investment? Answer with JSON: {"is_funding": true/false, "confidence": 0.0-1.0, "reason": "brief explanation"}

Title: "${title}"`;

    const headers = {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://github.com/your-repo",
      "X-Title": "TechCrunch Funding Classifier",
    };

    const data = {
      model: "anthropic/claude-3-haiku",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 200,
      temperature: 0.1,
    };

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers,
        body: JSON.stringify(data),
        signal: AbortSignal.timeout(30000), // 30 second timeout
      }
    );

    if (response.status === 200) {
      const result = (await response.json()) as OpenRouterResponse;
      let aiResponse = result.choices[0].message.content.trim();

      try {
        // Clean up response if it has markdown
        if (aiResponse.startsWith("```")) {
          aiResponse = aiResponse.split("\n", 2)[1];
        }
        if (aiResponse.endsWith("```")) {
          aiResponse = aiResponse.substring(0, aiResponse.lastIndexOf("\n"));
        }

        const classification = JSON.parse(aiResponse) as ClassificationResult;
        const isFunding = classification.is_funding ?? false;

        console.log(`${title} ${isFunding}`);
        return isFunding;
      } catch (error) {
        // JSON parsing error
        return null;
      }
    } else {
      return null;
    }
  } catch (error) {
    // Network or other errors
    return null;
  }
}
