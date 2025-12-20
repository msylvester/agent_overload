import React from "react";

interface TemporalResponseProps {
  text: string;
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
    .map((line) => line.replace(/^[•\-*]\s*/, "").trim())
    .filter(Boolean);

  // Extract analysis
  const analysisMatch = text.match(/\*\*Analysis:\*\*\n([\s\S]+)/);
  const analysis = analysisMatch?.[1]?.trim() || "";

  return { start, end, companies, analysis };
}

export default function TemporalResponse({ text }: TemporalResponseProps) {
  const { start, end, companies, analysis } = parseTemporalResponse(text);

  return (
    <div className="space-y-3">
      {/* Time Period Header */}
      <div className="rounded-sm border-2 border-[#8b6914] bg-gradient-to-r from-[#d5c29a] to-[#c9b88a] p-3">
        <div className="font-[var(--font-press-start)] text-[#2c1f18] text-xs uppercase">
          Time Period
        </div>
        <div className="mt-1 text-[#2c1f18] text-sm">
          {start} to {end}
        </div>
      </div>

      {/* Companies Grid */}
      {companies.length > 0 && (
        <div className="rounded-sm border-2 border-[#7b6b4a] bg-[#e5d8b0] p-3">
          <div className="mb-2 font-[var(--font-press-start)] text-[#2c1f18] text-xs uppercase">
            Companies Found ({companies.length})
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {companies.map((company, index) => (
              <div
                className="border border-[#8b7a52] bg-[#c9b88a] px-2 py-1 text-[#2c1f18] text-xs"
                key={index}
              >
                {company}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analysis Card */}
      {analysis && (
        <div className="rounded-sm border-2 border-[#7b6b4a] bg-[#e5d8b0] p-3">
          <div className="mb-2 font-[var(--font-press-start)] text-[#2c1f18] text-xs uppercase">
            Analysis
          </div>
          <div className="whitespace-pre-wrap text-[#2c1f18] text-xs leading-relaxed">
            {analysis}
          </div>
        </div>
      )}
    </div>
  );
}
