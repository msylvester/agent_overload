import React from "react";
import { Streamdown } from "streamdown";

interface ResearchResponseProps {
  ragResponse: string;
}

export default function ResearchResponse({ ragResponse }: ResearchResponseProps) {
  return (
    <div className="space-y-2">
      <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 px-3 py-1.5">
        <span className="text-xs font-semibold text-blue-300 uppercase tracking-wider">
          Research Results
        </span>
      </div>
      <div className="rounded-lg border border-white/10 bg-white/5 p-3">
        <Streamdown
          className="modern-markdown"
          controls={false}
          parseIncompleteMarkdown={true}
        >
          {ragResponse}
        </Streamdown>
      </div>
    </div>
  );
}
