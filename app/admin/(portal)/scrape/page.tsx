"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

interface HealthData {
  status: string;
}

interface StatusData {
  last_run?: {
    timestamp?: string;
    status?: string;
    articles_found?: number;
    companies_inserted?: number;
    companies_skipped?: number;
  };
  [key: string]: unknown;
}

export default function ScrapePage() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [status, setStatus] = useState<StatusData | null>(null);
  const [healthError, setHealthError] = useState(false);
  const [statusError, setStatusError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState(false);
  const [scrapeResult, setScrapeResult] = useState<string | null>(null);
  const [scrapeError, setScrapeError] = useState("");

  const handleTriggerScrape = async () => {
    if (
      !window.confirm(
        "Are you sure? This will scrape TechCrunch and TechStartups.",
      )
    ) {
      return;
    }
    setScraping(true);
    setScrapeResult(null);
    setScrapeError("");
    try {
      const res = await fetch("/api/admin/scrape/trigger", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        const parts: string[] = [];
        if (data.articles_found !== undefined)
          parts.push(`Articles found: ${data.articles_found}`);
        if (data.companies_inserted !== undefined)
          parts.push(`Companies inserted: ${data.companies_inserted}`);
        const msg = parts.length > 0 ? parts.join(", ") : "Scrape completed";
        setScrapeResult(msg);
        toast.success(msg);
        fetchData();
      } else {
        setScrapeError("Scrape failed — upstream error");
        toast.error("Scrape failed");
      }
    } catch {
      setScrapeError("Scrape failed — connection error");
      toast.error("Scrape failed");
    } finally {
      setScraping(false);
    }
  };

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/scrape/health");
      if (res.ok) {
        setHealth(await res.json());
        setHealthError(false);
      } else {
        setHealthError(true);
      }
    } catch {
      setHealthError(true);
    }

    try {
      const res = await fetch("/api/admin/scrape/status");
      if (res.ok) {
        setStatus(await res.json());
        setStatusError(false);
      } else {
        setStatusError(true);
      }
    } catch {
      setStatusError(true);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const isHealthy =
    health?.status === "healthy" || health?.status === "ok";
  const lastRun = status?.last_run;

  return (
    <div>
      <h1 className="text-sm tracking-[3px] text-[#d4a853] [text-shadow:0_0_10px_rgba(212,168,83,0.4)] mb-8">
        SCRAPE STATUS
      </h1>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-[#2b2b2b] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Health */}
          <div className="border-2 border-[#2b2b2b] bg-[#141016] p-4">
            <div className="text-[8px] tracking-[1px] text-[#c0b896] mb-3">
              SERVICE HEALTH
            </div>
            {healthError ? (
              <span className="text-[10px] text-red-400">UNREACHABLE</span>
            ) : (
              <div className="flex items-center gap-2">
                <span
                  className={`inline-block w-3 h-3 rounded-full ${isHealthy ? "bg-green-500" : "bg-red-500"}`}
                />
                <span className="text-[10px] text-[#f0e6d2]">
                  {isHealthy ? "HEALTHY" : "UNHEALTHY"}
                </span>
              </div>
            )}
          </div>

          {/* Last Run */}
          <div className="border-2 border-[#2b2b2b] bg-[#141016] p-4">
            <div className="text-[8px] tracking-[1px] text-[#c0b896] mb-3">
              LAST RUN
            </div>
            {statusError ? (
              <span className="text-[10px] text-red-400">
                Failed to fetch status
              </span>
            ) : lastRun ? (
              <div className="space-y-2">
                <div className="text-[9px] text-[#f0e6d2]">
                  TIME: {lastRun.timestamp || "Unknown"}
                </div>
                {lastRun.status && (
                  <div className="text-[9px] text-[#f0e6d2]">
                    STATUS: {lastRun.status}
                  </div>
                )}
                {lastRun.articles_found !== undefined && (
                  <div className="text-[9px] text-[#f0e6d2]">
                    ARTICLES FOUND: {lastRun.articles_found}
                  </div>
                )}
                {lastRun.companies_inserted !== undefined && (
                  <div className="text-[9px] text-[#f0e6d2]">
                    COMPANIES INSERTED: {lastRun.companies_inserted}
                  </div>
                )}
                {lastRun.companies_skipped !== undefined && (
                  <div className="text-[9px] text-[#f0e6d2]">
                    COMPANIES SKIPPED: {lastRun.companies_skipped}
                  </div>
                )}
              </div>
            ) : (
              <span className="text-[9px] text-[#6e6e6e]">
                No run data available
              </span>
            )}
          </div>

          {/* Trigger Scrape */}
          <div className="border-2 border-[#2b2b2b] bg-[#141016] p-4">
            <button
              type="button"
              disabled={scraping}
              onClick={handleTriggerScrape}
              className="px-6 py-2 border-2 border-[#555555] bg-[linear-gradient(#373737,#181818)] text-[9px] tracking-[2px] text-[#f5f5dc] hover:border-[#7abaff] hover:shadow-[0_0_15px_rgba(93,172,255,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {scraping ? "SCRAPING..." : "TRIGGER SCRAPE"}
            </button>
            {scrapeResult && (
              <p className="text-[9px] text-green-400 mt-3">{scrapeResult}</p>
            )}
            {scrapeError && (
              <p className="text-[9px] text-red-400 mt-3">{scrapeError}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
