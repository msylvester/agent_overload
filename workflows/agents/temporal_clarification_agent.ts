import type { TemporalClarificationData } from "@/lib/types";

const TIME_PHRASES =
  /\b(last\s+\d+\s+(?:day|week|month|year)s?|this\s+(?:week|month|quarter|year)|in\s+(?:january|february|march|april|may|june|july|august|september|october|november|december)|(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{4}|q[1-4]\s+\d{4}|\d{4}|recent(?:ly)?|yesterday|today|past\s+\d+\s+(?:day|week|month|year)s?)\b/i;

function extractTimePhrase(query: string): string | null {
  const match = query.match(TIME_PHRASES);
  return match ? match[0] : null;
}

export function buildTemporalClarification(
  query: string
): TemporalClarificationData {
  const detectedTimePhrase = extractTimePhrase(query);

  return {
    originalQuery: query,
    detectedTimePhrase,
    message: "THE ORACLE REQUIRES A TIME BOUNDARY",
    fields: [
      {
        name: "time_range",
        label: "Choose a time range",
        type: "buttons",
        options: [
          { id: "last_3_days", label: "Last 3 days" },
          { id: "last_7_days", label: "Last 7 days" },
          { id: "last_30_days", label: "Last 30 days" },
        ],
      },
    ],
  };
}
