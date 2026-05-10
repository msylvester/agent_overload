"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const handleLogout = async () => {
    setPending(true);
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      router.replace("/admin");
      router.refresh();
    } finally {
      setPending(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={pending}
      className="mx-auto px-8 py-2 border-2 border-[#555555] bg-[linear-gradient(#373737,#181818)] text-[#f5f5dc] text-xs uppercase tracking-[3px] cursor-pointer disabled:opacity-60"
    >
      {pending ? "..." : "Log out"}
    </button>
  );
}
