export function AdminErrorState({
  message = "Something went wrong",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="border-2 border-[#2b2b2b] bg-[#141016] p-6 text-center">
      <p className="text-[10px] text-red-400 mb-4">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="px-4 py-2 border-2 border-[#555555] bg-[linear-gradient(#373737,#181818)] text-[9px] tracking-[2px] text-[#f5f5dc] hover:border-[#7abaff] transition-colors"
        >
          RETRY
        </button>
      )}
    </div>
  );
}
