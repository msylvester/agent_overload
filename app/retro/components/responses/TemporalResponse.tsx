"use client";

import React, { useState } from "react";

export interface TemporalResponseProps {
  text: string;
  onCompanySelect?: (company: CompanyDetails) => void;
}

export interface CompanyDetails {
  company_name: string;
  posted_date?: string;
  source?: string;
  founded_year?: string;
  description?: string;
  sector?: string;
  funding_amount?: string;
  total_funding?: string;
  investors?: string[] | string;
}

function parseTemporalResponse(text: string) {
  // Extract time period
  const timeMatch = text.match(/\*\*Time Period:\*\* (.+?) to (.+)/);
  const start = timeMatch?.[1] || "";
  const end = timeMatch?.[2] || "";

  // Extract companies
  const companiesMatch = text.match(/\*\*Companies Found:\*\*\n([\s\S]+?)\n\n/);
  const companiesText = companiesMatch?.[1] || "";
  const companies = companiesText
    .split("\n")
    .map((line) => line.replace(/^[•\-\*]\s*/, "").trim())
    .filter(Boolean);

  // Extract analysis
  const analysisMatch = text.match(/\*\*Analysis:\*\*\n([\s\S]+)/);
  const analysis = analysisMatch?.[1]?.trim() || "";

  return { start, end, companies, analysis };
}

export function CompanyCard({
  company,
  onClose,
}: {
  company: CompanyDetails;
  onClose: () => void;
}) {
  return (
    <div className="border-2 border-[#8b6914] bg-[#e5d8b0] p-4 rounded-sm mt-3 relative">
      <button
        onClick={onClose}
        className="absolute top-2 right-2 text-[#8b6914] hover:text-[#2c1f18] font-bold text-sm cursor-pointer"
      >
        ✕
      </button>

      <div className="text-xs font-[var(--font-press-start)] uppercase text-[#8b6914] mb-3">
        {company.company_name}
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs text-[#2c1f18]">
        {company.sector && (
          <div>
            <span className="font-bold">Sector:</span> {company.sector}
          </div>
        )}
        {company.founded_year && (
          <div>
            <span className="font-bold">Founded:</span> {company.founded_year}
          </div>
        )}
        {company.funding_amount && (
          <div>
            <span className="font-bold">Funding:</span>{" "}
            {company.funding_amount}
          </div>
        )}
        {company.total_funding && (
          <div>
            <span className="font-bold">Total Funding:</span>{" "}
            {company.total_funding}
          </div>
        )}
      </div>

      {company.investors && company.investors.length > 0 && (
        <div className="mt-2 text-xs text-[#2c1f18]">
          <span className="font-bold">Investors:</span>{" "}
          {Array.isArray(company.investors)
            ? company.investors.join(", ")
            : company.investors}
        </div>
      )}

      {company.description && (
        <div className="mt-2 text-xs leading-relaxed text-[#2c1f18]">
          <span className="font-bold">Description:</span>{" "}
          {company.description}
        </div>
      )}

      {(company.source || company.posted_date) && (
        <div className="mt-2 text-xs text-[#7b6b4a]">
          {company.source && <span>Source: {company.source}</span>}
          {company.source && company.posted_date && <span> · </span>}
          {company.posted_date && <span>Posted: {company.posted_date}</span>}
        </div>
      )}
    </div>
  );
}

export default function TemporalResponse({ text, onCompanySelect }: TemporalResponseProps) {
  const { start, end, companies, analysis } = parseTemporalResponse(text);
  const [loading, setLoading] = useState<string | null>(null);

  async function handleCompanyClick(companyName: string) {
    if (loading) return;
    setLoading(companyName);
    try {
      const res = await fetch(
        `/api/company/${encodeURIComponent(companyName)}`
      );
      if (res.ok) {
        const data = await res.json();
        onCompanySelect?.(data);
      } else {
        onCompanySelect?.({ company_name: companyName });
      }
    } catch {
      onCompanySelect?.({ company_name: companyName });
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-3">
      {/* Time Period Header */}
      <div className="border-2 border-[#8b6914] bg-gradient-to-r from-[#d5c29a] to-[#c9b88a] p-3 rounded-sm">
        <div className="text-xs font-[var(--font-press-start)] uppercase text-[#2c1f18]">
          Time Period
        </div>
        <div className="text-sm mt-1 text-[#2c1f18]">
          {start} to {end}
        </div>
      </div>

      {/* Companies Grid */}
      {companies.length > 0 && (
        <div className="border-2 border-[#7b6b4a] bg-[#e5d8b0] p-3 rounded-sm">
          <div className="text-xs font-[var(--font-press-start)] mb-2 uppercase text-[#2c1f18]">
            Companies Found ({companies.length})
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {companies.map((company, index) => (
              <button
                key={index}
                onClick={() => handleCompanyClick(company)}
                disabled={loading === company}
                className="bg-[#c9b88a] border border-[#8b7a52] px-2 py-1 text-xs text-[#2c1f18] text-left cursor-pointer hover:bg-[#b8a876] hover:border-[#8b6914] transition-colors disabled:opacity-50"
              >
                {loading === company ? "Loading..." : company}
              </button>
            ))}
          </div>

        </div>
      )}

      {/* Analysis Card */}
      {analysis && (
        <div className="border-2 border-[#7b6b4a] bg-[#e5d8b0] p-3 rounded-sm">
          <div className="text-xs font-[var(--font-press-start)] mb-2 uppercase text-[#2c1f18]">
            Analysis
          </div>
          <div className="text-xs leading-relaxed whitespace-pre-wrap text-[#2c1f18]">
            {analysis}
          </div>
        </div>
      )}
    </div>
  );
}
