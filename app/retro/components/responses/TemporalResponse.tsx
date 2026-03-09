import React from "react";

interface TemporalResponseProps {
  text: string;
}

function parseTemporalResponse(text: string) {
  const timeMatch = text.match(/\*\*Time Period:\*\* (.+?) to (.+)/);
  const start = timeMatch?.[1] || "";
  const end = timeMatch?.[2] || "";

  const companiesMatch = text.match(/\*\*Companies Found:\*\*\n([\s\S]+?)\n\n/);
  const companiesText = companiesMatch?.[1] || "";
  const companies = companiesText
    .split("\n")
    .map((line) => line.replace(/^[•\-\*]\s*/, "").trim())
    .filter(Boolean);

  const analysisMatch = text.match(/\*\*Analysis:\*\*\n([\s\S]+)/);
  const analysis = analysisMatch?.[1]?.trim() || "";

  return { start, end, companies, analysis };
}

export default function TemporalResponse({ text }: TemporalResponseProps) {
  const { start, end, companies, analysis } = parseTemporalResponse(text);

  return (
    <div className="space-y-2">
      {/* Time Period Header */}
      <div className="rounded-lg border border-purple-500/20 bg-purple-500/10 p-3">
        <div className="text-xs font-semibold text-purple-300 uppercase tracking-wider">
          Time Period
        </div>
        <div className="text-sm mt-1 text-gray-200">
          {start} to {end}
        </div>
      </div>

      {/* Companies */}
      {companies.length > 0 && (
        <div className="rounded-lg border border-white/10 bg-white/5 p-3">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Companies Found ({companies.length})
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {companies.map((company, index) => (
              <div
                key={index}
                className="rounded-md bg-white/5 border border-white/10 px-2 py-1 text-xs text-gray-300"
              >
                {company}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analysis */}
      {analysis && (
        <div className="rounded-lg border border-white/10 bg-white/5 p-3">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
            Analysis
          </div>
          <div className="text-xs leading-relaxed whitespace-pre-wrap text-gray-300">
            {analysis}
          </div>
        </div>
      )}
    </div>
  );
}
