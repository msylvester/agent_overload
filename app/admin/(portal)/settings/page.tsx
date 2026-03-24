"use client";

import { useEffect, useState } from "react";

interface SettingsData {
  envVars: Record<string, boolean>;
  kbzChronUrl: string;
  kbzChronConnected: boolean;
  dbConnected: boolean;
}

const ENV_VAR_LABELS: Record<string, string> = {
  ADMIN_USERNAME: "Admin Username",
  ADMIN_PASSWORD: "Admin Password",
  ADMIN_SESSION_SECRET: "Session Secret",
  KBZ_CHRON_URL: "KBZ Chron URL",
  POSTGRES_URL: "Postgres URL",
};

export default function SettingsPage() {
  const [data, setData] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load settings");
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <h1 className="text-sm tracking-[3px] text-[#d4a853] [text-shadow:0_0_10px_rgba(212,168,83,0.4)] mb-8">
        SETTINGS
      </h1>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-8 bg-[#2b2b2b] animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <p className="text-[9px] text-red-400">{error}</p>
      ) : data ? (
        <div className="space-y-6">
          {/* Environment Variables */}
          <div className="border-2 border-[#2b2b2b] bg-[#141016] p-4">
            <h2 className="text-[10px] tracking-[2px] text-[#d4a853] mb-4">
              ENVIRONMENT VARIABLES
            </h2>
            <div className="space-y-2">
              {Object.entries(data.envVars).map(([key, present]) => (
                <div
                  key={key}
                  className="flex items-center justify-between border-b border-[#2b2b2b] pb-2"
                >
                  <span className="text-[8px] text-[#c0b896]">
                    {ENV_VAR_LABELS[key] || key}
                  </span>
                  <span
                    className={`text-[8px] ${present ? "text-green-400" : "text-red-400"}`}
                  >
                    {present ? "SET" : "MISSING"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Service Connections */}
          <div className="border-2 border-[#2b2b2b] bg-[#141016] p-4">
            <h2 className="text-[10px] tracking-[2px] text-[#d4a853] mb-4">
              SERVICE CONNECTIONS
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-[#2b2b2b] pb-2">
                <div>
                  <div className="text-[8px] text-[#c0b896]">KBZ CHRON</div>
                  <div className="text-[7px] text-[#6e6e6e]">
                    {data.kbzChronUrl}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${data.kbzChronConnected ? "bg-green-500" : "bg-red-500"}`}
                  />
                  <span
                    className={`text-[8px] ${data.kbzChronConnected ? "text-green-400" : "text-red-400"}`}
                  >
                    {data.kbzChronConnected ? "CONNECTED" : "UNREACHABLE"}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-[8px] text-[#c0b896]">DATABASE</div>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${data.dbConnected ? "bg-green-500" : "bg-red-500"}`}
                  />
                  <span
                    className={`text-[8px] ${data.dbConnected ? "text-green-400" : "text-red-400"}`}
                  >
                    {data.dbConnected ? "CONNECTED" : "UNREACHABLE"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
