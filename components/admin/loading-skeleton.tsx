export function AdminLoadingSkeleton({
  rows = 5,
  height = "h-8",
}: {
  rows?: number;
  height?: string;
}) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={`${height} bg-[#2b2b2b] animate-pulse`} />
      ))}
    </div>
  );
}
