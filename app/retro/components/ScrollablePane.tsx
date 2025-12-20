import React, { type ReactNode } from "react";

interface ScrollablePaneProps {
  children: ReactNode;
}

export default function ScrollablePane({ children }: ScrollablePaneProps) {
  return (
    <div className="box-border h-full w-full overflow-y-auto border-[#7b6b4a] border-[3px] bg-[#d5c29a] p-2.5 text-[#2c1f18] text-[11px] leading-[1.5] shadow-[inset_0_0_0_2px_#bca47c] [&::-webkit-scrollbar-thumb]:bg-[#8e7a52] [&::-webkit-scrollbar-track]:bg-[#c1ae85] [&::-webkit-scrollbar]:w-2">
      {children}
    </div>
  );
}
