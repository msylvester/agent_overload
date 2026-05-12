import "server-only";

import { format } from "date-fns";
import type { ObjectId } from "mongodb";
import { logger } from "@/lib/logger";
import { getCollection } from "@/workflows/mongoPool";

export type ScrapeSession = {
  _id: ObjectId;
  session_id: string;
  trigger?: string;
  cutoff_days?: number;
  sources?: string[];
  started_at?: string;
  finished_at?: string;
  total_duration_ms?: number;
  document_count?: number;
  companies_extracted?: number;
  companies_inserted?: number;
  companies_updated?: number;
  companies_skipped?: number;
  companies_failed?: number;
  articles_found?: number;
  articles_classified_in?: number;
  errors?: number;
  timings_ms?: Record<string, unknown>;
  per_source?: Record<string, unknown>;
  failed_upserts?: number;
  created_at?: string | Date;
};

export type ScrapeDocument = {
  _id: ObjectId;
  session_id: string;
  source?: string;
  company_name?: string;
  url?: string;
  article_title?: string;
  posted_date?: string;
  outcome?: string;
  error?: string | null;
  classify_ms?: number;
  extract_ms?: number;
  enrich_ms?: number;
  embed_ms?: number;
  store_ms?: number;
  total_ms?: number;
  created_at?: string | Date;
};

const SCRAPE_SESSIONS_COLLECTION = "scrape_sessions";
const SCRAPE_DOCUMENTS_COLLECTION = "scrape_documents";

function sessionTimestamp(session: ScrapeSession): number {
  for (const value of [
    session.created_at,
    session.finished_at,
    session.started_at,
  ]) {
    if (!value) {
      continue;
    }
    const parsed = value instanceof Date ? value.getTime() : Date.parse(value);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  return 0;
}

export async function getRecentScrapeSessions(
  limit = 25
): Promise<ScrapeSession[]> {
  try {
    const collection = await getCollection<ScrapeSession>(
      SCRAPE_SESSIONS_COLLECTION
    );
    const sessions = await collection
      .find({})
      .sort({ created_at: -1, finished_at: -1, started_at: -1 })
      .limit(limit)
      .toArray();
    return sessions.sort((a, b) => sessionTimestamp(b) - sessionTimestamp(a));
  } catch (error) {
    logger.error("Failed to load scrape sessions:", error);
    return [];
  }
}

export async function getScrapeSessionById(
  sessionId: string
): Promise<ScrapeSession | null> {
  try {
    const collection = await getCollection<ScrapeSession>(
      SCRAPE_SESSIONS_COLLECTION
    );
    return await collection.findOne({ session_id: sessionId });
  } catch (error) {
    logger.error("Failed to load scrape session:", error);
    return null;
  }
}

export async function getScrapeDocumentsForSession(
  sessionId: string,
  limit = 1000
): Promise<ScrapeDocument[]> {
  try {
    const collection = await getCollection<ScrapeDocument>(
      SCRAPE_DOCUMENTS_COLLECTION
    );
    return await collection
      .find({ session_id: sessionId })
      .sort({ total_ms: -1 })
      .limit(limit)
      .toArray();
  } catch (error) {
    logger.error("Failed to load scrape documents:", error);
    return [];
  }
}

export function formatMs(ms?: number | null): string {
  if (ms == null || Number.isNaN(ms)) {
    return "—";
  }
  if (ms < 1000) {
    return `${Math.round(ms)} ms`;
  }
  return `${(ms / 1000).toFixed(2)} s`;
}

export function formatDuration(ms?: number | null): string {
  if (ms == null || Number.isNaN(ms)) {
    return "—";
  }
  if (ms >= 60_000) {
    const totalSeconds = Math.round(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}m ${seconds}s`;
  }
  return formatMs(ms);
}

export function formatDateTime(value?: string | Date | null): string {
  if (!value) {
    return "—";
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return typeof value === "string" ? value : "—";
  }
  return format(date, "yyyy-MM-dd HH:mm:ss");
}

export function formatNumber(n?: number | null): string {
  if (n == null || Number.isNaN(n)) {
    return "—";
  }
  return n.toLocaleString();
}

export function formatKeyValueEntries(
  obj?: Record<string, unknown> | null
): Array<{ key: string; value: string }> {
  if (!obj || typeof obj !== "object") {
    return [];
  }
  return Object.entries(obj).map(([key, value]) => {
    if (value == null) {
      return { key, value: "—" };
    }
    if (typeof value === "number") {
      return {
        key,
        value: key.endsWith("_ms") ? formatMs(value) : formatNumber(value),
      };
    }
    if (typeof value === "object") {
      return { key, value: JSON.stringify(value) };
    }
    return { key, value: String(value) };
  });
}
