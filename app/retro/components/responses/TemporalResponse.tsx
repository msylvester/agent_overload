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
    .map((line) => line.replace(/^[•\-\*]\s*/, "").trim())
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
              <div
                key={index}
                className="bg-[#c9b88a] border border-[#8b7a52] px-2 py-1 text-xs text-[#2c1f18]"
              >
                {company}
              </div>
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
