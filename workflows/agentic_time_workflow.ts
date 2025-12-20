/**
 *
 * Agentic Time Range Classification with Validation and Retry
 * Returns ISO date strings (YYYY-MM-DD format) for identify_time.ts tests
 */

import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), "../.env") });

import { END, StateGraph } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";
import { debugError, debugLog } from "@/lib/utils";
import { getTemporal, type ResponseItem } from "./agents/temporal_router_agent";

/* ============================
   SCHEMA & TYPES
============================ */

const TimeClassificationSchema = z.object({
  start: z.string().describe("Start date as ISO date string (YYYY-MM-DD)"),
  end: z.string().describe("End date as ISO date string (YYYY-MM-DD)"),
  confidence: z.number().min(0).max(1),
  rationale: z.string(),
});

export type TimeClassification = z.infer<typeof TimeClassificationSchema>;

interface QueryPattern {
  type:
    | "relative_days"
    | "relative_months"
    | "relative_years"
    | "specific_month"
    | "specific_year"
    | "quarter"
    | "specific_range"
    | "vague"
    | "this_year"
    | "half_year";
  expectedDuration?: number; // days
  toleranceFactor?: number;
  metadata?: Record<string, any>;
}

interface TimeExtractionState {
  query: string;
  model: string;
  currentExtraction: TimeClassification | null;
  previousExtractions: TimeClassification[];
  results: ResponseItem | null;
  validationErrors: string[];
  validationPassed: boolean;
  attemptCount: number;
  maxAttempts: number;
  finalResult: TimeClassification | null;
}

/* ============================
   DATE HELPERS (ISO format)
============================ */

function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

function daysAgoISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0];
}

function monthsAgoISO(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return d.toISOString().split("T")[0];
}

function yearsAgoISO(years: number): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  return d.toISOString().split("T")[0];
}

function firstOfMonthISO(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split("T")[0];
}

function daysBetween(start: string, end: string): number {
  const d1 = new Date(start).getTime();
  const d2 = new Date(end).getTime();
  return Math.abs(d2 - d1) / (1000 * 60 * 60 * 24);
}

/* ============================
   QUERY CLASSIFIER
============================ */

function classifyQueryPattern(query: string): QueryPattern {
  const q = query.toLowerCase();

  // Specific month (e.g., "in March 2024", "April 2023", "December 2023")
  const monthNames = [
    "january",
    "february",
    "march",
    "april",
    "may",
    "june",
    "july",
    "august",
    "september",
    "october",
    "november",
    "december",
  ];
  for (let i = 0; i < monthNames.length; i++) {
    if (q.includes(monthNames[i])) {
      const yearMatch = q.match(/\b(20\d{2})\b/);
      if (yearMatch) {
        return {
          type: "specific_month",
          metadata: { month: i + 1, year: Number.parseInt(yearMatch[1]) },
        };
      }
    }
  }

  // This year (e.g., "founded this year", "companies this year")
  if (q.includes("this year")) {
    return {
      type: "this_year",
      metadata: { year: new Date().getFullYear() },
    };
  }

  // Last quarter (treat as last 3 months, not Q4)
  if (q.match(/(?:last|past)\s+quarter(?:\s|$)/)) {
    return {
      type: "relative_months",
      expectedDuration: 90,
      toleranceFactor: 0.15,
      metadata: { months: 3 },
    };
  }

  // First half / Second half (e.g., "first half of 2024", "second half of 2023")
  const halfMatch = q.match(/(first|second)\s+half/);
  if (halfMatch) {
    const yearMatch = q.match(/\b(20\d{2})\b/);
    if (yearMatch) {
      return {
        type: "half_year",
        metadata: {
          half: halfMatch[1],
          year: Number.parseInt(yearMatch[1]),
        },
      };
    }
  }

  // Relative years (e.g., "last 2 years", "past year")
  const yearsMatch = q.match(/(?:last|past)\s+(\d+)\s+years?/);
  if (yearsMatch) {
    const years = Number.parseInt(yearsMatch[1]);
    return {
      type: "relative_years",
      expectedDuration: years * 365,
      toleranceFactor: 0.1,
      metadata: { years },
    };
  }

  // Single year (e.g., "past year")
  if (q.match(/(?:past|last)\s+year(?:\s|$)/)) {
    return {
      type: "relative_years",
      expectedDuration: 365,
      toleranceFactor: 0.1,
      metadata: { years: 1 },
    };
  }

  // Relative months (e.g., "last 6 months")
  const monthsMatch = q.match(/(?:last|past)\s+(\d+)\s+months?/);
  if (monthsMatch) {
    const months = Number.parseInt(monthsMatch[1]);
    return {
      type: "relative_months",
      expectedDuration: months * 30,
      toleranceFactor: 0.15,
      metadata: { months },
    };
  }

  // Relative days (e.g., "last 30 days")
  const daysMatch = q.match(/(?:last|past)\s+(\d+)\s+days?/);
  if (daysMatch) {
    const days = Number.parseInt(daysMatch[1]);
    return {
      type: "relative_days",
      expectedDuration: days,
      toleranceFactor: 0.1,
      metadata: { days },
    };
  }

  // Quarter (e.g., "Q1 2024")
  const quarterMatch = q.match(/q([1-4])\s+(20\d{2})/);
  if (quarterMatch) {
    const quarter = Number.parseInt(quarterMatch[1]);
    const year = Number.parseInt(quarterMatch[2]);
    return {
      type: "quarter",
      metadata: { quarter, year },
    };
  }

  // Specific range (e.g., "between January and March 2023", "January to June 2024")
  if (
    ((q.includes("between") || q.includes(" to ")) && q.includes("and")) ||
    (q.includes("january") && q.includes("june")) ||
    (q.includes("july") && q.includes("september"))
  ) {
    const yearMatch = q.match(/(20\d{2})/);
    if (yearMatch) {
      // Try to extract month names for validation
      const firstMonth = monthNames.findIndex((m) => q.includes(m));
      const lastMonthIdx = monthNames.findIndex(
        (m, idx) => idx > firstMonth && q.includes(m)
      );

      return {
        type: "specific_range",
        metadata: {
          year: Number.parseInt(yearMatch[1]),
          firstMonth: firstMonth >= 0 ? firstMonth + 1 : undefined,
          lastMonth: lastMonthIdx >= 0 ? lastMonthIdx + 1 : undefined,
        },
      };
    }
  }

  // Specific year (e.g., "2024", "in 2024")
  const yearMatch = q.match(/\b(20\d{2})\b/);
  if (
    yearMatch &&
    !q.includes("between") &&
    !q.includes("q1") &&
    !q.includes("q2") &&
    !q.includes("q3") &&
    !q.includes("q4")
  ) {
    return {
      type: "specific_year",
      metadata: { year: Number.parseInt(yearMatch[1]) },
    };
  }

  // This month (from 1st to today)
  if (q.includes("this month")) {
    const today = new Date();
    const dayOfMonth = today.getDate();
    return {
      type: "relative_months",
      expectedDuration: dayOfMonth, // Days elapsed in current month
      toleranceFactor: 0.1,
      metadata: { thisMonth: true, daysInMonth: dayOfMonth },
    };
  }

  // Vague (e.g., "recent", "recently")
  if (q.includes("recent")) {
    return {
      type: "vague",
      expectedDuration: 90, // Default to 3 months
      toleranceFactor: 0.5,
    };
  }

  return { type: "vague", toleranceFactor: 0.5 };
}

/* ============================
   SYSTEM PROMPT
============================ */

function buildSystemPrompt(): string {
  const today = todayISO();
  const currentYear = new Date().getFullYear();

  return `
You are a time range extraction expert.

CRITICAL: Return dates as ISO strings in YYYY-MM-DD format.

Current date: ${today}
Current year: ${currentYear}

Examples:
- "last 6 months" → start: "${monthsAgoISO(6)}", end: "${today}"
- "last 30 days" → start: "${daysAgoISO(30)}", end: "${today}"
- "2024" or "in 2024" → start: "2024-01-01", end: "2024-12-31"
- "Q1 2024" → start: "2024-01-01", end: "2024-03-31"
- "past year" → start: "${yearsAgoISO(1)}", end: "${today}"
- "recent" → start: "${monthsAgoISO(3)}", end: "${today}" (default to 3 months)
- "this month" → start: "${firstOfMonthISO()}", end: "${today}"
- "this year" → start: "${currentYear}-01-01", end: "${today}" (NOT end of year!)
- "March 2024" → start: "2024-03-01", end: "2024-03-31"
- "April 2023" → start: "2023-04-01", end: "2023-04-30"
- "first half of 2024" → start: "2024-01-01", end: "2024-06-30"
- "second half of 2023" → start: "2023-07-01", end: "2023-12-31"
- "January to June 2024" → start: "2024-01-01", end: "2024-06-30"
- "last quarter" → start: "${monthsAgoISO(3)}", end: "${today}" (last 3 months)

Rules:
- For "last X days/months/years": end is TODAY, start is X period ago
- For "this year": start is Jan 1 of current year, end is TODAY (not Dec 31!)
- For specific months (e.g., "March 2024"): use first and last day of that month
- For "first half": Jan 1 to Jun 30 of specified year
- For "second half": Jul 1 to Dec 31 of specified year
- For specific years/quarters: use exact calendar dates
- For "between X and Y" or "X to Y": identify the months/dates from context
- Always use YYYY-MM-DD format

Output format:
{
  "start": "YYYY-MM-DD",
  "end": "YYYY-MM-DD",
  "confidence": 0.0-1.0,
  "rationale": "brief explanation"
}
`;
}

/* ============================
   LLM
============================ */

function createLlm(model: string) {
  return new ChatOpenAI({
    apiKey: process.env.OPENROUTER_API_KEY!,
    model,
    temperature: 0.1,
    configuration: { baseURL: "https://openrouter.ai/api/v1" },
  });
}

/* ============================
   GRAPH NODES
============================ */

async function extractNode(
  state: TimeExtractionState
): Promise<Partial<TimeExtractionState>> {
  debugLog(
    `\n[EXTRACT] Attempt ${state.attemptCount + 1}/${state.maxAttempts}`
  );
  debugLog(`[EXTRACT] Query: "${state.query}"`);

  const llm = createLlm(state.model);
  const structured = llm.withStructuredOutput(TimeClassificationSchema);

  const res = await structured.invoke([
    { role: "system", content: buildSystemPrompt() },
    { role: "user", content: state.query },
  ]);

  debugLog(
    `[EXTRACT] Result: start=${res.start}, end=${res.end}, confidence=${res.confidence.toFixed(2)}`
  );
  const duration = daysBetween(res.start, res.end);
  debugLog(`[EXTRACT] Duration: ${duration.toFixed(1)} days`);

  return { currentExtraction: res };
}

/*
 * temporalAdvice - Calls getTemporal to fetch companies and generate inference
 * @param TimeExtractionState
 * @return Partial<TimeExtractionState> with results populated
 */
async function temporalAdvice(
  state: TimeExtractionState
): Promise<Partial<TimeExtractionState>> {
  debugLog("\n[TEMPORAL ADVICE] Fetching companies and generating analysis...");

  const { currentExtraction, query } = state;

  if (!currentExtraction) {
    debugLog("[TEMPORAL ADVICE] No extraction available, skipping");
    return { results: null };
  }

  const { start, end } = currentExtraction;

  try {
    // Call getTemporal with the extracted time range
    const result: ResponseItem = await getTemporal(
      query, // inputText
      start, // startDate
      end, // endDate
      "", // domain (empty for now)
      40, // limit
      state.model // model
    );

    debugLog(`[TEMPORAL ADVICE] Found ${result.companies.length} companies`);
    debugLog(
      `[TEMPORAL ADVICE] Inference: ${result.inference.substring(0, 100)}...`
    );

    return { results: result };
  } catch (err) {
    debugError("[TEMPORAL ADVICE] Error calling getTemporal:", err);
    return { results: null };
  }
}

async function validateNode(
  state: TimeExtractionState
): Promise<Partial<TimeExtractionState>> {
  debugLog("\n[VALIDATE] Checking extraction...");

  const { currentExtraction, query } = state;
  if (!currentExtraction) {
    return {
      validationPassed: false,
      validationErrors: ["No extraction to validate"],
    };
  }

  const { start, end } = currentExtraction;
  const errors: string[] = [];

  // Parse dates
  const startDate = new Date(start);
  const endDate = new Date(end);

  // Universal validation
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    errors.push("Invalid date format");
  }

  if (startDate >= endDate) {
    errors.push(`start (${start}) must be before end (${end})`);
  }

  const duration = daysBetween(start, end);
  const pattern = classifyQueryPattern(query);
  debugLog(`[VALIDATE] Pattern detected: ${pattern.type}`);

  // Pattern-specific validation
  switch (pattern.type) {
    case "relative_days": {
      const expectedDuration = pattern.expectedDuration!;
      const tolerance = expectedDuration * pattern.toleranceFactor!;

      if (Math.abs(duration - expectedDuration) > tolerance) {
        errors.push(
          `Duration mismatch: expected ~${pattern.metadata!.days} days, ` +
            `got ${duration.toFixed(1)} days. Off by ${Math.abs(duration - expectedDuration).toFixed(1)} days.`
        );
      }

      const today = todayISO();
      if (end !== today) {
        errors.push(`End should be today (${today}), got ${end}`);
      }
      break;
    }

    case "relative_months": {
      const expectedDuration = pattern.expectedDuration!;
      const tolerance = expectedDuration * pattern.toleranceFactor!;

      if (Math.abs(duration - expectedDuration) > tolerance) {
        errors.push(
          `Duration mismatch: expected ~${pattern.metadata!.months || "N"} months ` +
            `(~${expectedDuration} days), got ${duration.toFixed(1)} days.`
        );
      }

      if (!pattern.metadata?.thisMonth) {
        const today = todayISO();
        if (end !== today) {
          errors.push(
            `End should be today (${today}) for relative periods, got ${end}`
          );
        }
      }
      break;
    }

    case "relative_years": {
      const expectedDuration = pattern.expectedDuration!;
      const tolerance = expectedDuration * pattern.toleranceFactor!;

      if (Math.abs(duration - expectedDuration) > tolerance) {
        errors.push(
          `Duration mismatch: expected ~${pattern.metadata!.years} year(s) ` +
            `(~${expectedDuration} days), got ${duration.toFixed(1)} days.`
        );
      }

      const today = todayISO();
      if (end !== today) {
        errors.push(`End should be today (${today}), got ${end}`);
      }
      break;
    }

    case "specific_year": {
      const year = pattern.metadata!.year;
      const expectedStart = `${year}-01-01`;
      const expectedEnd = `${year}-12-31`;

      if (start !== expectedStart) {
        errors.push(
          `Year ${year} should start on ${expectedStart}, got ${start}`
        );
      }
      if (end !== expectedEnd) {
        errors.push(`Year ${year} should end on ${expectedEnd}, got ${end}`);
      }
      break;
    }

    case "quarter": {
      const quarter = pattern.metadata!.quarter;
      const year = pattern.metadata!.year;
      const quarterStarts: Record<number, string> = {
        1: `${year}-01-01`,
        2: `${year}-04-01`,
        3: `${year}-07-01`,
        4: `${year}-10-01`,
      };
      const quarterEnds: Record<number, string> = {
        1: `${year}-03-31`,
        2: `${year}-06-30`,
        3: `${year}-09-30`,
        4: `${year}-12-31`,
      };

      if (start !== quarterStarts[quarter]) {
        errors.push(
          `Q${quarter} ${year} should start on ${quarterStarts[quarter]}, got ${start}`
        );
      }
      if (end !== quarterEnds[quarter]) {
        errors.push(
          `Q${quarter} ${year} should end on ${quarterEnds[quarter]}, got ${end}`
        );
      }
      break;
    }

    case "specific_month": {
      const month = pattern.metadata!.month;
      const year = pattern.metadata!.year;
      const daysInMonth = new Date(year, month, 0).getDate();
      const expectedStart = `${year}-${String(month).padStart(2, "0")}-01`;
      const expectedEnd = `${year}-${String(month).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;

      if (start !== expectedStart) {
        errors.push(
          `Month ${month}/${year} should start on ${expectedStart}, got ${start}`
        );
      }
      if (end !== expectedEnd) {
        errors.push(
          `Month ${month}/${year} should end on ${expectedEnd}, got ${end}`
        );
      }
      break;
    }

    case "this_year": {
      const year = pattern.metadata!.year;
      const expectedStart = `${year}-01-01`;
      const today = todayISO();

      if (start !== expectedStart) {
        errors.push(
          `"This year" should start on ${expectedStart}, got ${start}`
        );
      }
      if (end !== today) {
        errors.push(`"This year" should end on today (${today}), got ${end}`);
      }
      break;
    }

    case "half_year": {
      const half = pattern.metadata!.half;
      const year = pattern.metadata!.year;

      if (half === "first") {
        const expectedStart = `${year}-01-01`;
        const expectedEnd = `${year}-06-30`;
        if (start !== expectedStart) {
          errors.push(
            `First half of ${year} should start on ${expectedStart}, got ${start}`
          );
        }
        if (end !== expectedEnd) {
          errors.push(
            `First half of ${year} should end on ${expectedEnd}, got ${end}`
          );
        }
      } else if (half === "second") {
        const expectedStart = `${year}-07-01`;
        const expectedEnd = `${year}-12-31`;
        if (start !== expectedStart) {
          errors.push(
            `Second half of ${year} should start on ${expectedStart}, got ${start}`
          );
        }
        if (end !== expectedEnd) {
          errors.push(
            `Second half of ${year} should end on ${expectedEnd}, got ${end}`
          );
        }
      }
      break;
    }

    case "specific_range": {
      // For "between January and March 2023" type queries
      const year = pattern.metadata?.year;
      const firstMonth = pattern.metadata?.firstMonth;
      const lastMonth = pattern.metadata?.lastMonth;

      if (year && firstMonth && lastMonth) {
        const expectedStart = `${year}-${String(firstMonth).padStart(2, "0")}-01`;
        const lastMonthDays = new Date(year, lastMonth, 0).getDate();
        const expectedEnd = `${year}-${String(lastMonth).padStart(2, "0")}-${String(lastMonthDays).padStart(2, "0")}`;

        if (start !== expectedStart) {
          errors.push(`Range should start on ${expectedStart}, got ${start}`);
        }
        if (end !== expectedEnd) {
          errors.push(`Range should end on ${expectedEnd}, got ${end}`);
        }
      } else if (year) {
        // Check if it's roughly the right year
        if (
          !start.startsWith(year.toString()) &&
          !start.startsWith((year - 1).toString())
        ) {
          errors.push(`Expected dates around ${year}, got ${start}`);
        }
      }
      break;
    }

    case "vague": {
      // Lenient validation for vague queries
      if (duration < 7 || duration > 730) {
        errors.push(
          `Vague queries typically mean 1 week to 2 years, got ${duration.toFixed(1)} days`
        );
      }
      break;
    }
  }

  if (errors.length === 0) {
    debugLog("[VALIDATE] ✓ All checks passed");
    return { validationPassed: true, validationErrors: [] };
  }
  debugLog(`[VALIDATE] ✗ Found ${errors.length} validation errors:`);
  errors.forEach((err, i) => debugLog(`  ${i + 1}. ${err}`));
  return { validationPassed: false, validationErrors: errors };
}

async function retryNode(
  state: TimeExtractionState
): Promise<Partial<TimeExtractionState>> {
  debugLog("\n[RETRY] Constructing feedback prompt...");
  debugLog(`[RETRY] Attempt ${state.attemptCount + 2}/${state.maxAttempts}`);

  const { query, currentExtraction, validationErrors } = state;
  const pattern = classifyQueryPattern(query);

  // Build explicit calculation hints
  let calculationHint = "";
  const today = todayISO();

  if (pattern.type === "relative_days" && pattern.metadata?.days) {
    const expectedStart = daysAgoISO(pattern.metadata.days);
    calculationHint = `

CORRECT CALCULATION FOR THIS QUERY:
- Query requests: last ${pattern.metadata.days} days
- Today: ${today}
- Correct START: ${expectedStart} (${pattern.metadata.days} days ago)
- Correct END: ${today} (today)
`;
  } else if (pattern.type === "relative_months" && pattern.metadata?.months) {
    const expectedStart = monthsAgoISO(pattern.metadata.months);
    calculationHint = `

CORRECT CALCULATION FOR THIS QUERY:
- Query requests: last ${pattern.metadata.months} months
- Today: ${today}
- Correct START: ${expectedStart} (approximately ${pattern.metadata.months} months ago)
- Correct END: ${today} (today)
`;
  } else if (
    pattern.type === "relative_months" &&
    pattern.metadata?.thisMonth
  ) {
    const expectedStart = firstOfMonthISO();
    calculationHint = `

CORRECT CALCULATION FOR THIS QUERY:
- Query requests: this month (from 1st of month to today)
- Today: ${today}
- Correct START: ${expectedStart} (1st of this month)
- Correct END: ${today} (today, NOT end of month)
`;
  } else if (pattern.type === "relative_years" && pattern.metadata?.years) {
    const expectedStart = yearsAgoISO(pattern.metadata.years);
    calculationHint = `

CORRECT CALCULATION FOR THIS QUERY:
- Query requests: last ${pattern.metadata.years} year(s)
- Today: ${today}
- Correct START: ${expectedStart} (${pattern.metadata.years} year(s) ago)
- Correct END: ${today} (today)
`;
  } else if (pattern.type === "specific_year" && pattern.metadata?.year) {
    calculationHint = `

CORRECT CALCULATION FOR THIS QUERY:
- Query requests: year ${pattern.metadata.year}
- Correct START: ${pattern.metadata.year}-01-01 (January 1st)
- Correct END: ${pattern.metadata.year}-12-31 (December 31st)
`;
  } else if (pattern.type === "quarter") {
    const q = pattern.metadata!.quarter;
    const y = pattern.metadata!.year;
    const starts: Record<number, string> = {
      1: `${y}-01-01`,
      2: `${y}-04-01`,
      3: `${y}-07-01`,
      4: `${y}-10-01`,
    };
    const ends: Record<number, string> = {
      1: `${y}-03-31`,
      2: `${y}-06-30`,
      3: `${y}-09-30`,
      4: `${y}-12-31`,
    };
    calculationHint = `

CORRECT CALCULATION FOR THIS QUERY:
- Query requests: Q${q} ${y}
- Correct START: ${starts[q]}
- Correct END: ${ends[q]}
`;
  } else if (pattern.type === "specific_month") {
    const month = pattern.metadata!.month;
    const year = pattern.metadata!.year;
    const daysInMonth = new Date(year, month, 0).getDate();
    const expectedStart = `${year}-${String(month).padStart(2, "0")}-01`;
    const expectedEnd = `${year}-${String(month).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;
    calculationHint = `

CORRECT CALCULATION FOR THIS QUERY:
- Query requests: Month ${month} of ${year}
- Correct START: ${expectedStart} (first day of month)
- Correct END: ${expectedEnd} (last day of month)
`;
  } else if (pattern.type === "this_year") {
    const year = pattern.metadata!.year;
    const expectedStart = `${year}-01-01`;
    calculationHint = `

CORRECT CALCULATION FOR THIS QUERY:
- Query requests: this year (${year})
- Correct START: ${expectedStart} (January 1st)
- Correct END: ${today} (today, NOT end of year!)
`;
  } else if (pattern.type === "half_year") {
    const half = pattern.metadata!.half;
    const year = pattern.metadata!.year;
    if (half === "first") {
      calculationHint = `

CORRECT CALCULATION FOR THIS QUERY:
- Query requests: first half of ${year}
- Correct START: ${year}-01-01 (January 1st)
- Correct END: ${year}-06-30 (June 30th)
`;
    } else {
      calculationHint = `

CORRECT CALCULATION FOR THIS QUERY:
- Query requests: second half of ${year}
- Correct START: ${year}-07-01 (July 1st)
- Correct END: ${year}-12-31 (December 31st)
`;
    }
  }

  const feedbackPrompt = `
PREVIOUS ATTEMPT FAILED VALIDATION

Original query: "${query}"

Previous extraction:
- Start: ${currentExtraction!.start}
- End: ${currentExtraction!.end}
- Duration: ${daysBetween(currentExtraction!.start, currentExtraction!.end).toFixed(1)} days
- Rationale: ${currentExtraction!.rationale}

VALIDATION ERRORS:
${validationErrors.map((err, i) => `${i + 1}. ${err}`).join("\n")}
${calculationHint}

CRITICAL: You must fix these errors! Use the exact dates provided above.
Return dates in YYYY-MM-DD format.
`;

  debugLog("[RETRY] Invoking LLM with feedback...");

  const llm = createLlm(state.model);
  const structured = llm.withStructuredOutput(TimeClassificationSchema);

  const res = await structured.invoke([
    { role: "system", content: buildSystemPrompt() },
    { role: "user", content: feedbackPrompt },
  ]);

  debugLog(
    `[RETRY] New result: start=${res.start}, end=${res.end}, confidence=${res.confidence.toFixed(2)}`
  );
  debugLog(
    `[RETRY] Duration: ${daysBetween(res.start, res.end).toFixed(1)} days`
  );

  return {
    currentExtraction: res,
    previousExtractions: [...state.previousExtractions, currentExtraction!],
    attemptCount: state.attemptCount + 1,
  };
}

async function finalizeNode(
  state: TimeExtractionState
): Promise<Partial<TimeExtractionState>> {
  debugLog("\n[FINALIZE] Packaging final result...");

  if (state.attemptCount > 0) {
    debugLog(`[FINALIZE] Used ${state.attemptCount} retries`);
  }

  if (state.validationPassed) {
    debugLog("[FINALIZE] ✓ Validation passed");
  } else {
    debugLog("[FINALIZE] ⚠ Validation did not pass, using best attempt");
  }

  return { finalResult: state.currentExtraction };
}

/**
 * handleFailureNode - Sets fallback response when validation fails or confidence is too low
 */
async function handleFailureNode(
  state: TimeExtractionState
): Promise<Partial<TimeExtractionState>> {
  debugLog("\n[HANDLE FAILURE] Setting fallback response...");
  return {
    finalResult: null,
    results: {
      companies: [],
      inference:
        "Try asking: any companies funded this past month? OR any companies funded this past week? OR ask about a specific month like: for the month of september what companies raised a round of funding?",
    },
  };
}

/* ============================
   ROUTING
============================ */

/**
 * routeAfterFinish is a conditional route (edge)
 * after validating the time range, decides whether to fetch temporal data or handle failure
 * @param TimeExtractionState
 * @return 'temporal' to fetch companies, 'handleFailure' to set fallback message
 */
function routeAfterFinish(
  state: TimeExtractionState
): "temporal" | "handleFailure" {
  debugLog("\n[ROUTE AFTER FINISH] Deciding next step...");

  const { validationPassed, currentExtraction } = state;

  // If validation passed and we have a good extraction, get temporal data
  if (
    validationPassed &&
    currentExtraction &&
    currentExtraction.confidence >= 0.85
  ) {
    debugLog(
      "[ROUTE AFTER FINISH] → TEMPORAL (validation passed with good confidence, fetching companies)"
    );
    return "temporal";
  }

  // If validation failed but we still have an extraction with reasonable confidence
  if (
    currentExtraction &&
    currentExtraction.confidence >= 0.85 &&
    validationPassed
  ) {
    debugLog(
      "[ROUTE AFTER FINISH] → TEMPORAL (using high confidence extraction)"
    );
    return "temporal";
  }

  debugLog(
    "[ROUTE AFTER FINISH] → HANDLE FAILURE (low quality or low confidence extraction)"
  );
  return "handleFailure";
}

function routeAfterValidation(
  state: TimeExtractionState
): "finalize" | "retry" {
  if (state.validationPassed) {
    debugLog("[DECISION] → FINALIZE (validation passed)");
    return "finalize";
  }

  if (state.attemptCount >= state.maxAttempts - 1) {
    debugLog(
      `[DECISION] → FINALIZE (max attempts ${state.maxAttempts} reached)`
    );
    return "finalize";
  }

  debugLog(
    `[DECISION] → RETRY (attempt ${state.attemptCount + 1}/${state.maxAttempts})`
  );
  return "retry";
}

/* ============================
   GRAPH
============================ */

const agenticGraph: any = new StateGraph<TimeExtractionState>({
  channels: {
    query: { value: null },
    model: { value: null },
    currentExtraction: { value: null },
    previousExtractions: {
      value: (left: TimeClassification[], right: TimeClassification[]) =>
        right.length > 0 ? right : left,
      default: () => [],
    },
    results: { value: null },
    validationErrors: {
      value: (left: string[], right: string[]) =>
        right.length > 0 ? right : left,
      default: () => [],
    },
    validationPassed: { value: null },
    attemptCount: { value: null },
    maxAttempts: { value: null },
    finalResult: { value: null },
  },
} as any);

agenticGraph.addNode("extract", extractNode);
agenticGraph.addNode("validate", validateNode);
agenticGraph.addNode("retry", retryNode);
agenticGraph.addNode("finalize", finalizeNode);
agenticGraph.addNode("temporalAdvice", temporalAdvice);
agenticGraph.addNode("handleFailure", handleFailureNode);

//conddtionally connect to the temporalAdvice node if the Start/End in state are correct and validated
//
agenticGraph.addConditionalEdges("validate", routeAfterValidation, {
  finalize: "finalize",
  retry: "retry",
});

agenticGraph.addEdge("extract", "validate");

// Conditional edge from finalize to temporalAdvice or handleFailure
agenticGraph.addConditionalEdges("finalize", routeAfterFinish, {
  temporal: "temporalAdvice",
  handleFailure: "handleFailure",
});

agenticGraph.addEdge("retry", "validate");
agenticGraph.addEdge("temporalAdvice", END);
agenticGraph.addEdge("handleFailure", END);

agenticGraph.setEntryPoint("extract");

const agenticApp = agenticGraph.compile();

// Export the compiled graph for testing
export { agenticApp };

/* ============================
   PUBLIC API
============================ */

export async function classifyTime(
  query: string,
  model = "gpt-4o-mini"
): Promise<{
  timeClassification: TimeClassification | null;
  results: ResponseItem | null;
}> {
  try {
    const res = await agenticApp.invoke({
      query,
      model,
      currentExtraction: null,
      previousExtractions: [],
      results: null,
      validationErrors: [],
      validationPassed: false,
      attemptCount: 0,
      maxAttempts: 2,
      finalResult: null,
    });

    // handleFailureNode sets finalResult to null and results to the fallback message
    return {
      timeClassification: res.finalResult,
      results: res.results,
    };
  } catch (err) {
    debugError("Error classifying time:", err);

    // Fallback
    const today = todayISO();
    const sixMonthsAgo = monthsAgoISO(6);

    return {
      timeClassification: {
        start: sixMonthsAgo,
        end: today,
        confidence: 0,
        rationale:
          "Fatal error during classification; defaulted to last 6 months.",
      },
      results: null,
    };
  }
}
