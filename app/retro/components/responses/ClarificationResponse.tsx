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
  last_3_days: () => ({ start: daysAgo(3), end: today() }),
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
    <div className="space-y-3">
      {/* Message Header */}
      <div className="border-2 border-[#8b6914] bg-gradient-to-r from-[#d5c29a] to-[#c9b88a] p-3 rounded-sm">
        <div className="text-xs font-[var(--font-press-start)] uppercase text-[#2c1f18]">
          Clarification Needed
        </div>
        <div className="text-sm mt-1 text-[#2c1f18]">
          {data.message}
        </div>
        {data.detectedTimePhrase && (
          <div className="text-xs mt-1 text-[#5a4a30] italic">
            Detected: &ldquo;{data.detectedTimePhrase}&rdquo;
          </div>
        )}
      </div>

      {/* Time Range Buttons */}
      <div className="border-2 border-[#7b6b4a] bg-[#e5d8b0] p-3 rounded-sm">
        <div className="text-xs font-[var(--font-press-start)] mb-2 uppercase text-[#2c1f18]">
          {field.label}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {field.options.map((option) => (
            <button
              key={option.id}
              disabled={selectedId !== null}
              onClick={() => handleClick(option.id)}
              className={`
                border-2 px-2 py-1.5 text-[10px] uppercase
                font-[var(--font-press-start)]
                cursor-pointer
                disabled:cursor-not-allowed disabled:opacity-50
                ${
                  selectedId === option.id
                    ? "border-[#8b6914] bg-[#8b6914] text-[#f5f5dc]"
                    : "border-[#8b7a52] bg-[#c9b88a] text-[#2c1f18] hover:bg-[#b8a87a]"
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
