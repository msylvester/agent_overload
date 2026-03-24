export function AdminEmptyState({
  message = "Nothing to show",
}: {
  message?: string;
}) {
  return (
    <div className="border-2 border-[#2b2b2b] bg-[#141016] p-6 text-center">
      <p className="text-[9px] text-[#6e6e6e]">{message}</p>
    </div>
  );
}
