"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";

interface CompanyDetail {
  company_name: string;
  funding_amount: string;
  series: string;
  sector: string;
  investors: string | string[];
  date: string;
  source: string;
  title: string;
  url: string;
  description: string;
  founded_year: string;
  total_funding: string;
  valuation: string;
}

const FIELDS: { key: keyof CompanyDetail; label: string }[] = [
  { key: "funding_amount", label: "FUNDING AMOUNT" },
  { key: "series", label: "SERIES" },
  { key: "sector", label: "SECTOR" },
  { key: "investors", label: "INVESTORS" },
  { key: "date", label: "DATE" },
  { key: "source", label: "SOURCE" },
  { key: "title", label: "TITLE" },
  { key: "url", label: "URL" },
  { key: "description", label: "DESCRIPTION" },
  { key: "founded_year", label: "FOUNDED YEAR" },
  { key: "total_funding", label: "TOTAL FUNDING" },
  { key: "valuation", label: "VALUATION" },
];

export default function CompanyDetailPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = use(params);
  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(
      `/api/admin/companies?company_name=${encodeURIComponent(name)}`,
    )
      .then((r) => r.json())
      .then((data) => {
        const results = Array.isArray(data) ? data : data.results || [];
        setCompany(results[0] || null);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load company details");
        setLoading(false);
      });
  }, [name]);

  const renderValue = (key: keyof CompanyDetail, value: unknown) => {
    if (!value) return "—";
    if (key === "url" && typeof value === "string") {
      return (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#6ca0d4] hover:text-[#8ec0f4] break-all"
        >
          {value}
        </a>
      );
    }
    if (key === "investors" && Array.isArray(value)) {
      return value.join(", ");
    }
    return String(value);
  };

  return (
    <div>
      <Link
        href="/admin/companies"
        className="text-[9px] text-[#c0b896] hover:text-[#f0e6d2] tracking-[1px] mb-6 inline-block"
      >
        &larr; BACK TO COMPANIES
      </Link>

      {loading ? (
        <div className="space-y-3">
          <div className="h-6 w-48 bg-[#2b2b2b] animate-pulse" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-4 bg-[#2b2b2b] animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <p className="text-[9px] text-red-400">{error}</p>
      ) : !company ? (
        <p className="text-[9px] text-[#6e6e6e]">Company not found</p>
      ) : (
        <>
          <h1 className="text-sm tracking-[3px] text-[#d4a853] [text-shadow:0_0_10px_rgba(212,168,83,0.4)] mb-6">
            {company.company_name}
          </h1>

          <div className="border-2 border-[#2b2b2b] bg-[#141016] p-4 space-y-4">
            {FIELDS.map(({ key, label }) => (
              <div key={key} className="border-b border-[#2b2b2b] pb-3">
                <div className="text-[7px] tracking-[1px] text-[#c0b896] mb-1">
                  {label}
                </div>
                <div className="text-[9px] text-[#f0e6d2]">
                  {renderValue(key, company[key])}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
