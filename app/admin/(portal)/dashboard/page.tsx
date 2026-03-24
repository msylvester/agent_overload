"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface MetricCard {
  label: string;
  value: string;
  status?: "ok" | "error" | "loading";
}

interface Company {
  company_name: string;
  funding_amount: string;
  series: string;
  date: string;
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<MetricCard[]>([
    { label: "TOTAL SUBSCRIBERS", value: "...", status: "loading" },
    { label: "SCRAPE HEALTH", value: "...", status: "loading" },
    { label: "LAST SCRAPE", value: "...", status: "loading" },
  ]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(true);
  const [companiesError, setCompaniesError] = useState("");

  useEffect(() => {
    // Fetch subscriber count
    fetch("/api/subscribe")
      .then((r) => r.json())
      .then((data) => {
        const count = Array.isArray(data) ? data.length : 0;
        setMetrics((prev) =>
          prev.map((m) =>
            m.label === "TOTAL SUBSCRIBERS"
              ? { ...m, value: String(count), status: "ok" }
              : m,
          ),
        );
      })
      .catch(() => {
        setMetrics((prev) =>
          prev.map((m) =>
            m.label === "TOTAL SUBSCRIBERS"
              ? { ...m, value: "Error", status: "error" }
              : m,
          ),
        );
      });

    // Fetch scrape health
    fetch("/api/admin/scrape/health")
      .then((r) => r.json())
      .then((data) => {
        const healthy = data.status === "healthy" || data.status === "ok";
        setMetrics((prev) =>
          prev.map((m) =>
            m.label === "SCRAPE HEALTH"
              ? {
                  ...m,
                  value: healthy ? "HEALTHY" : "UNHEALTHY",
                  status: healthy ? "ok" : "error",
                }
              : m,
          ),
        );
      })
      .catch(() => {
        setMetrics((prev) =>
          prev.map((m) =>
            m.label === "SCRAPE HEALTH"
              ? { ...m, value: "UNREACHABLE", status: "error" }
              : m,
          ),
        );
      });

    // Fetch scrape status
    fetch("/api/admin/scrape/status")
      .then((r) => r.json())
      .then((data) => {
        const lastRun = data.last_run?.timestamp || data.last_run || "Unknown";
        setMetrics((prev) =>
          prev.map((m) =>
            m.label === "LAST SCRAPE"
              ? { ...m, value: String(lastRun), status: "ok" }
              : m,
          ),
        );
      })
      .catch(() => {
        setMetrics((prev) =>
          prev.map((m) =>
            m.label === "LAST SCRAPE"
              ? { ...m, value: "Error", status: "error" }
              : m,
          ),
        );
      });

    // Fetch recent companies
    fetch("/api/admin/companies?days=7&limit=5")
      .then((r) => r.json())
      .then((data) => {
        setCompanies(Array.isArray(data) ? data : data.results || []);
        setCompaniesLoading(false);
      })
      .catch(() => {
        setCompaniesError("Failed to load companies");
        setCompaniesLoading(false);
      });
  }, []);

  return (
    <div>
      <h1 className="text-sm tracking-[3px] text-[#d4a853] [text-shadow:0_0_10px_rgba(212,168,83,0.4)] mb-8">
        DASHBOARD
      </h1>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {metrics.map((card) => (
          <div
            key={card.label}
            className="border-2 border-[#2b2b2b] bg-[#141016] p-4"
          >
            <div className="text-[8px] tracking-[1px] text-[#c0b896] mb-3">
              {card.label}
            </div>
            <div className="flex items-center gap-2">
              {card.status === "loading" ? (
                <div className="h-4 w-24 bg-[#2b2b2b] animate-pulse" />
              ) : (
                <>
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${
                      card.status === "ok" ? "bg-green-500" : "bg-red-500"
                    }`}
                  />
                  <span className="text-[10px] text-[#f0e6d2]">
                    {card.value}
                  </span>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Recent Companies */}
      <div className="border-2 border-[#2b2b2b] bg-[#141016] p-4">
        <h2 className="text-[10px] tracking-[2px] text-[#d4a853] mb-4">
          RECENT COMPANIES
        </h2>
        {companiesLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-4 bg-[#2b2b2b] animate-pulse" />
            ))}
          </div>
        ) : companiesError ? (
          <p className="text-[9px] text-red-400">{companiesError}</p>
        ) : companies.length === 0 ? (
          <p className="text-[9px] text-[#6e6e6e]">
            No recent companies found
          </p>
        ) : (
          <div className="space-y-2">
            {companies.map((c, i) => (
              <Link
                key={i}
                href={`/admin/companies/${encodeURIComponent(c.company_name)}`}
                className="flex justify-between items-center border border-[#2b2b2b] px-3 py-2 hover:bg-[#1c1520] transition-colors"
              >
                <span className="text-[9px] text-[#f0e6d2]">
                  {c.company_name}
                </span>
                <span className="text-[8px] text-[#c0b896]">
                  {c.funding_amount || c.series || ""}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
