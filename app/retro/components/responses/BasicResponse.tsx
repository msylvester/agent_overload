import React from "react";

interface BasicResponseProps {
  text: string;
}

export default function BasicResponse({ text }: BasicResponseProps) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-3">
      <div className="text-xs text-gray-200 leading-relaxed whitespace-pre-wrap">
        {text}
      </div>
    </div>
  );
}
