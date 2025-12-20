import React from "react";
import { Streamdown } from "streamdown";

interface ResearchResponseProps {
  ragResponse: string;
}

export default function ResearchResponse({
  ragResponse,
}: ResearchResponseProps) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="rounded-sm border-2 border-[#8b6914] bg-gradient-to-r from-[#d5c29a] to-[#c9b88a] p-2">
        <div className="font-[var(--font-press-start)] text-[#2c1f18] text-xs uppercase">
          Research Results
        </div>
      </div>

      {/* Response Content */}
      <div className="rounded-sm border-2 border-[#7b6b4a] bg-[#e5d8b0] p-3">
        <Streamdown
          className="retro-markdown"
          controls={false}
          parseIncompleteMarkdown={true}
        >
          {ragResponse}
        </Streamdown>
      </div>
    </div>
  );
}
