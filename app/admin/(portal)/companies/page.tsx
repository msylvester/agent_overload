"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

interface Company {
  company_name: string;
  funding_amount: string;
  series: string;
  sector: string;
  source: string;
  date: string;
}

const PAGE_SIZE = 20;

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [sector, setSector] = useState("");
  const [series, setSeries] = useState("");
  const [page, setPage] = useState(0);

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ days: "30", limit: "200" });
      if (search) params.set("q", search);
      if (sector) params.set("sector", sector);
      if (series) params.set("series", series);

      const res = await fetch(`/api/admin/companies?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setCompanies(Array.isArray(data) ? data : data.results || []);
      setPage(0);
    } catch {
      setError("Failed to load companies");
    } finally {
      setLoading(false);
    }
  }, [search, sector, series]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const paginated = companies.slice(
    page * PAGE_SIZE,
    (page + 1) * PAGE_SIZE,
  );
  const totalPages = Math.ceil(companies.length / PAGE_SIZE);

  return (
    <div>
      <h1 className="text-sm tracking-[3px] text-[#d4a853] [text-shadow:0_0_10px_rgba(212,168,83,0.4)] mb-6">
        COMPANIES
      </h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          placeholder="SEARCH..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-[#050608] border-2 border-[#474747] px-3 py-2 text-[9px] text-[#f5f5dc] font-[inherit] placeholder:text-[#6e6e6e] outline-none w-48"
        />
        <select
          value={sector}
          onChange={(e) => setSector(e.target.value)}
          className="bg-[#050608] border-2 border-[#474747] px-3 py-2 text-[9px] text-[#f5f5dc] font-[inherit] outline-none"
        >
          <option value="">ALL SECTORS</option>
          <option value="AI">AI</option>
          <option value="Fintech">FINTECH</option>
          <option value="Healthcare">HEALTHCARE</option>
          <option value="SaaS">SAAS</option>
          <option value="Crypto">CRYPTO</option>
        </select>
        <select
          value={series}
          onChange={(e) => setSeries(e.target.value)}
          className="bg-[#050608] border-2 border-[#474747] px-3 py-2 text-[9px] text-[#f5f5dc] font-[inherit] outline-none"
        >
          <option value="">ALL SERIES</option>
          <option value="Seed">SEED</option>
          <option value="Series A">SERIES A</option>
          <option value="Series B">SERIES B</option>
          <option value="Series C">SERIES C</option>
          <option value="Series D">SERIES D</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-8 bg-[#2b2b2b] animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <p className="text-[9px] text-red-400">{error}</p>
      ) : companies.length === 0 ? (
        <p className="text-[9px] text-[#6e6e6e]">No companies found</p>
      ) : (
        <>
          {/* Header */}
          <div className="grid grid-cols-6 gap-2 border-b-2 border-[#5c5c5c] pb-2 mb-2">
            {["COMPANY", "FUNDING", "SERIES", "SECTOR", "SOURCE", "DATE"].map(
              (h) => (
                <span key={h} className="text-[7px] tracking-[1px] text-[#c0b896]">
                  {h}
                </span>
              ),
            )}
          </div>

          {/* Rows */}
          {paginated.map((c, i) => (
            <Link
              key={i}
              href={`/admin/companies/${encodeURIComponent(c.company_name)}`}
              className="grid grid-cols-6 gap-2 border-b border-[#2b2b2b] py-2 hover:bg-[#1c1520] transition-colors"
            >
              <span className="text-[8px] text-[#d4a853] truncate">
                {c.company_name}
              </span>
              <span className="text-[8px] text-[#f0e6d2] truncate">
                {c.funding_amount || "—"}
              </span>
              <span className="text-[8px] text-[#f0e6d2] truncate">
                {c.series || "—"}
              </span>
              <span className="text-[8px] text-[#f0e6d2] truncate">
                {c.sector || "—"}
              </span>
              <span className="text-[8px] text-[#f0e6d2] truncate">
                {c.source || "—"}
              </span>
              <span className="text-[8px] text-[#c0b896] truncate">
                {c.date || "—"}
              </span>
            </Link>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-6">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="text-[9px] text-[#c0b896] hover:text-[#f0e6d2] disabled:opacity-30 disabled:cursor-not-allowed"
              >
                &larr; PREV
              </button>
              <span className="text-[8px] text-[#6e6e6e]">
                {page + 1} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="text-[9px] text-[#c0b896] hover:text-[#f0e6d2] disabled:opacity-30 disabled:cursor-not-allowed"
              >
                NEXT &rarr;
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
