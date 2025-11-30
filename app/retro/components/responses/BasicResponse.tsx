import React from "react";

interface BasicResponseProps {
  text: string;
}

export default function BasicResponse({ text }: BasicResponseProps) {
  return (
    <div className="border-2 border-[#7b6b4a] bg-[#e5d8b0] p-3 rounded-sm">
      <div className="text-xs font-[var(--font-press-start)] mb-2 border-b border-[#8b7a52] pb-1 uppercase">
        Oracle&apos;s Wisdom
      </div>
      <div className="text-xs leading-relaxed whitespace-pre-wrap text-[#2c1f18]">
        {text}
      </div>
    </div>
  );
}
