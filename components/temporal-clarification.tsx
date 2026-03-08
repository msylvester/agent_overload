"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { TemporalClarificationData, ChatMessage } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { generateUUID } from "@/lib/utils";

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

const TIME_RANGES: Record<
  string,
  () => { start: string; end: string } | null
> = {
  last_7_days: () => ({ start: daysAgo(7), end: today() }),
  last_30_days: () => ({ start: daysAgo(30), end: today() }),
  last_90_days: () => ({ start: daysAgo(90), end: today() }),
  this_month: () => ({ start: firstOfMonth(), end: today() }),
  this_year: () => ({
    start: `${currentYear()}-01-01`,
    end: today(),
  }),
  custom_range: () => null,
};

export function TemporalClarification({
  data,
  sendMessage,
}: {
  data: TemporalClarificationData;
  sendMessage: (message: ChatMessage) => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleSelection = (optionId: string) => {
    if (selectedId) return;
    setSelectedId(optionId);

    const range = TIME_RANGES[optionId]?.();
    if (!range) return; // custom_range — future enhancement

    sendMessage({
      id: generateUUID(),
      role: "user",
      parts: [{ type: "text", text: data.originalQuery }],
      skipClarification: true,
      dateRange: { start: range.start, end: range.end },
    } as ChatMessage & { skipClarification: boolean; dateRange: { start: string; end: string } });
  };

  const field = data.fields[0];

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-4 rounded-xl border border-amber-500/30 bg-amber-950/10 p-4"
      initial={{ opacity: 0, y: 10 }}
    >
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold tracking-wide text-amber-400">
          {data.message}
        </p>
        {data.detectedTimePhrase && (
          <p className="text-xs text-muted-foreground">
            Detected: &ldquo;{data.detectedTimePhrase}&rdquo;
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {field.label}
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {field.options.map((option) => (
            <Button
              className={
                selectedId === option.id
                  ? "border-amber-500 bg-amber-500/20"
                  : ""
              }
              disabled={selectedId !== null}
              key={option.id}
              onClick={() => handleSelection(option.id)}
              size="sm"
              variant="outline"
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
