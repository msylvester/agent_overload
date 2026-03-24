"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

interface Subscriber {
  id: string;
  email: string;
  agreedToTos: boolean;
  createdAt: string;
}

interface Stats {
  total: number;
  thisWeek: number;
  thisMonth: number;
  daily: { date: string; count: number }[];
}

export default function SubscribersPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [stats, setStats] = useState<Stats | null>(null);

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
    fetch("/api/admin/subscribers/stats")
      .then((r) => r.json())
      .then((data) => setStats(data))
      .catch(() => {});
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

  const handleDelete = async (id: string, email: string) => {
    if (!window.confirm(`Delete subscriber ${email}?`)) return;
    try {
      const res = await fetch(`/api/admin/subscribers/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setSubscribers((prev) => prev.filter((s) => s.id !== id));
        toast.success("Subscriber deleted");
      } else {
        toast.error("Failed to delete subscriber");
      }
    } catch {
      toast.error("Failed to delete subscriber");
    }
  };

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

      {/* Stats */}
      {stats && (
        <div className="mb-6">
          <div className="grid grid-cols-3 gap-4 mb-4">
            {[
              { label: "TOTAL", value: stats.total },
              { label: "THIS WEEK", value: stats.thisWeek },
              { label: "THIS MONTH", value: stats.thisMonth },
            ].map((s) => (
              <div
                key={s.label}
                className="border-2 border-[#2b2b2b] bg-[#141016] p-3"
              >
                <div className="text-[7px] tracking-[1px] text-[#c0b896] mb-1">
                  {s.label}
                </div>
                <div className="text-[12px] text-[#d4a853]">{s.value}</div>
              </div>
            ))}
          </div>

          {/* Bar chart */}
          <div className="border-2 border-[#2b2b2b] bg-[#141016] p-3">
            <div className="text-[7px] tracking-[1px] text-[#c0b896] mb-3">
              SIGNUPS (LAST 14 DAYS)
            </div>
            <div className="flex items-end gap-1 h-20">
              {stats.daily.map((d) => {
                const max = Math.max(...stats.daily.map((x) => x.count), 1);
                const height = (d.count / max) * 100;
                return (
                  <div
                    key={d.date}
                    className="flex-1 flex flex-col items-center justify-end"
                    title={`${d.date}: ${d.count}`}
                  >
                    <div
                      className="w-full bg-[#d4a853] min-h-[2px]"
                      style={{ height: `${height}%` }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex gap-1 mt-1">
              {stats.daily.map((d) => (
                <div
                  key={d.date}
                  className="flex-1 text-center text-[5px] text-[#6e6e6e]"
                >
                  {d.date.slice(8)}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

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
          <div className="grid grid-cols-[1fr_80px_100px_40px] gap-2 border-b-2 border-[#5c5c5c] pb-2 mb-2">
            <span className="text-[7px] tracking-[1px] text-[#c0b896]">
              EMAIL
            </span>
            <span className="text-[7px] tracking-[1px] text-[#c0b896]">
              TOS
            </span>
            <span className="text-[7px] tracking-[1px] text-[#c0b896]">
              SIGNED UP
            </span>
            <span />
          </div>

          {filtered.map((s) => (
            <div
              key={s.id}
              className="grid grid-cols-[1fr_80px_100px_40px] gap-2 border-b border-[#2b2b2b] py-2 items-center"
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
              <button
                type="button"
                onClick={() => handleDelete(s.id, s.email)}
                className="text-[10px] text-red-400 hover:text-red-300"
                title="Delete subscriber"
              >
                X
              </button>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
