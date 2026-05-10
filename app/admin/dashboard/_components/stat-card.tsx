type StatCardProps = {
  label: string;
  count: number;
};

export default function StatCard({ label, count }: StatCardProps) {
  return (
    <div className="border-4 border-[#2b2b2b] bg-[#141016] shadow-[0_0_0_4px_#4e4e4e,0_0_16px_rgba(0,0,0,0.5)] p-3 flex flex-col gap-2 items-center justify-center">
      <div className="text-[9px] tracking-[2px] text-[#d4a853] uppercase">
        {label}
      </div>
      <div className="text-lg tracking-[2px] text-[#f0e6d2] font-mono">
        {count.toLocaleString()}
      </div>
    </div>
  );
}
