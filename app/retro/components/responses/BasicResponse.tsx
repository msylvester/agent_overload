import React from "react";

interface BasicResponseProps {
  text: string;
}

export default function BasicResponse({ text }: BasicResponseProps) {
  return (
    <div className="rounded-sm border-2 border-[#7b6b4a] bg-[#e5d8b0] p-3">
      <div className="mb-2 border-[#8b7a52] border-b pb-1 font-[var(--font-press-start)] text-xs uppercase">
        Oracle&apos;s Wisdom
      </div>
      <div className="whitespace-pre-wrap text-[#2c1f18] text-xs leading-relaxed">
        {text}
      </div>
    </div>
  );
}
