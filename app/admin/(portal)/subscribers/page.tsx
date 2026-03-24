"use client";

import { useEffect, useMemo, useState } from "react";

interface Subscriber {
  id: string;
  email: string;
  agreedToTos: boolean;
  createdAt: string;
}

export default function SubscribersPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const fetchSubscribers = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/subscribe");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setSubscribers(data.subscribers || []);
    } catch {
      setError("Failed to load subscribers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const filtered = useMemo(
    () =>
      search
        ? subscribers.filter((s) =>
            s.email.toLowerCase().includes(search.toLowerCase()),
          )
        : subscribers,
    [subscribers, search],
  );

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div>
      <h1 className="text-sm tracking-[3px] text-[#d4a853] [text-shadow:0_0_10px_rgba(212,168,83,0.4)] mb-6">
        SUBSCRIBERS
      </h1>

      {/* Total count */}
      <div className="text-[10px] text-[#c0b896] mb-4">
        TOTAL: {subscribers.length}
      </div>

      {/* Search + Export */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          placeholder="SEARCH BY EMAIL..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-[#050608] border-2 border-[#474747] px-3 py-2 text-[9px] text-[#f5f5dc] font-[inherit] placeholder:text-[#6e6e6e] outline-none w-64"
        />
        <a
          href="/api/admin/subscribers/export"
          className="px-4 py-2 border-2 border-[#555555] bg-[linear-gradient(#373737,#181818)] text-[9px] tracking-[2px] text-[#f5f5dc] hover:border-[#7abaff] transition-colors"
        >
          EXPORT CSV
        </a>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-8 bg-[#2b2b2b] animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <p className="text-[9px] text-red-400">{error}</p>
      ) : filtered.length === 0 ? (
        <p className="text-[9px] text-[#6e6e6e]">
          {subscribers.length === 0 ? "No subscribers yet" : "No results"}
        </p>
      ) : (
        <>
          {/* Header */}
          <div className="grid grid-cols-3 gap-2 border-b-2 border-[#5c5c5c] pb-2 mb-2">
            <span className="text-[7px] tracking-[1px] text-[#c0b896]">
              EMAIL
            </span>
            <span className="text-[7px] tracking-[1px] text-[#c0b896]">
              AGREED TO TOS
            </span>
            <span className="text-[7px] tracking-[1px] text-[#c0b896]">
              SIGNED UP
            </span>
          </div>

          {filtered.map((s) => (
            <div
              key={s.id}
              className="grid grid-cols-3 gap-2 border-b border-[#2b2b2b] py-2"
            >
              <span className="text-[8px] text-[#f0e6d2] truncate">
                {s.email}
              </span>
              <span className="text-[8px] text-[#f0e6d2]">
                {s.agreedToTos ? "YES" : "NO"}
              </span>
              <span className="text-[8px] text-[#c0b896]">
                {formatDate(s.createdAt)}
              </span>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
