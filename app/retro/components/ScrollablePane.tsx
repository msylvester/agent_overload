import React, { ReactNode } from 'react';

interface ScrollablePaneProps {
  children: ReactNode;
}

export default function ScrollablePane({ children }: ScrollablePaneProps) {
  return (
    <div className="h-full w-full bg-[#d5c29a] text-[#2c1f18] p-2.5 box-border border-[3px] border-[#7b6b4a] shadow-[inset_0_0_0_2px_#bca47c] text-[11px] leading-[1.5] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-[#c1ae85] [&::-webkit-scrollbar-thumb]:bg-[#8e7a52]">
      {children}
    </div>
  );
}
