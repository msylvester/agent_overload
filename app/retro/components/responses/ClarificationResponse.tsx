"use client";

import React, { useState } from "react";
import type { TemporalClarificationData } from "@/lib/types";

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

function today(): string {
  return new Date().toISOString().split("T")[0];
}

function firstOfMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

function currentYear(): number {
  return new Date().getFullYear();
}

const TIME_RANGES: Record<string, () => { start: string; end: string } | null> = {
  last_7_days: () => ({ start: daysAgo(7), end: today() }),
  last_30_days: () => ({ start: daysAgo(30), end: today() }),
  last_90_days: () => ({ start: daysAgo(90), end: today() }),
  this_month: () => ({ start: firstOfMonth(), end: today() }),
  this_year: () => ({ start: `${currentYear()}-01-01`, end: today() }),
  custom_range: () => null,
};

interface ClarificationResponseProps {
  data: TemporalClarificationData;
  onSelect: (data: { query: string; start: string; end: string }) => void;
}

export default function ClarificationResponse({ data, onSelect }: ClarificationResponseProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const field = data.fields[0];

  const handleClick = (optionId: string) => {
    if (selectedId) return;
    setSelectedId(optionId);

    const range = TIME_RANGES[optionId]?.();
    if (!range) return;

    onSelect({ query: data.originalQuery, start: range.start, end: range.end });
  };

  return (
    <div className="space-y-2">
      {/* Message */}
      <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3">
        <div className="text-xs font-semibold text-amber-300 uppercase tracking-wider">
          Clarification Needed
        </div>
        <div className="text-sm mt-1 text-gray-200">{data.message}</div>
        {data.detectedTimePhrase && (
          <div className="text-xs mt-1 text-gray-500 italic">
            Detected: &ldquo;{data.detectedTimePhrase}&rdquo;
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className="rounded-lg border border-white/10 bg-white/5 p-3">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          {field.label}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {field.options.map((option) => (
            <button
              key={option.id}
              disabled={selectedId !== null}
              onClick={() => handleClick(option.id)}
              className={`
                rounded-md px-2 py-1.5 text-xs font-medium transition-all duration-200
                cursor-pointer disabled:cursor-not-allowed disabled:opacity-50
                ${
                  selectedId === option.id
                    ? "bg-blue-600 text-white border border-blue-500"
                    : "bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10"
                }
              `}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
