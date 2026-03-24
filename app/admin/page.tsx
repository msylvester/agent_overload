"use client";

import React, { useState, FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) {
        router.push("/admin/dashboard");
      } else if (res.status === 401) {
        setError("INVALID CREDENTIALS");
      } else {
        setError("CONNECTION ERROR");
      }
    } catch {
      setError("CONNECTION ERROR");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top,#1c2840_0%,#05040a_70%)] text-[#f0e6d2] p-4 font-[var(--font-press-start),'Press_Start_2P',system-ui,sans-serif]">
      <div className="[image-rendering:pixelated] max-w-[900px] w-full border-4 border-[#2b2b2b] bg-[#141016] shadow-[0_0_0_4px_#4e4e4e,0_0_32px_rgba(0,0,0,0.7)] p-2">
        {/* TOP BAR */}
        <div className="flex items-center justify-center border-[3px] border-[#5c5c5c] px-2.5 py-1.5 bg-[linear-gradient(#403b3b,#262020)] [text-shadow:1px_1px_#000] mb-2">
          <div className="text-base tracking-[2px] sm:text-xs">
            KRYSTAL BALL Z /ADMIN
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="border-[3px] border-[#6b6b6b] bg-[#171217] shadow-[inset_0_0_0_2px_#2b2b2b] p-4">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_1.2fr] gap-6 items-center">
            {/* LEFT: CRYSTAL BALL */}
            <div className="flex items-center justify-center">
              <div className="relative w-full max-w-[320px] h-[320px]">
                <Image
                  src="/fortune.png"
                  alt="crystal ball"
                  fill
                  sizes="(max-width: 768px) 100vw, 320px"
                  className="object-contain [filter:drop-shadow(0_0_20px_rgba(93,172,255,0.6))_drop-shadow(0_0_40px_rgba(125,205,255,0.4))] animate-crystal-pulse"
                />
              </div>
            </div>

            {/* RIGHT: LOGIN FORM */}
            <div className="flex flex-col gap-4">
              {/* Admin Login Header */}
              <div className="border-b-2 border-[#5c5c5c] pb-2">
                <h1 className="text-sm tracking-[3px] text-[#d4a853] [text-shadow:0_0_10px_rgba(212,168,83,0.4)] text-center uppercase">
                  Admin Login
                </h1>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-5 mt-2">
                {/* USERNAME */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] tracking-[2px] text-[#c0b896] flex items-center gap-2">
                    <span className="text-[#d4a853]">&#x1F464;</span>
                    USERNAME
                  </label>
                  <div className="flex items-center gap-2 border-2 border-[#474747] px-3 py-2 bg-[#050608]">
                    <span className="text-[#d4a853] text-xs">&#x1F464;</span>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value);
                        setError("");
                      }}
                      className="flex-1 bg-transparent border-none outline-none text-[#f5f5dc] text-[11px] font-[inherit] placeholder:text-[#6e6e6e]"
                      placeholder="ENTER USERNAME..."
                    />
                  </div>
                </div>

                {/* PASSWORD */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] tracking-[2px] text-[#c0b896] flex items-center gap-2">
                    <span className="text-[#d4a853]">&#x1F512;</span>
                    PASSWORD
                  </label>
                  <div className="flex items-center gap-2 border-2 border-[#474747] px-3 py-2 bg-[#050608]">
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError("");
                      }}
                      className="flex-1 bg-transparent border-none outline-none text-[#f5f5dc] text-[11px] font-[inherit] placeholder:text-[#6e6e6e]"
                      placeholder=""
                    />
                  </div>
                </div>

                {/* FORGOT PASSWORD */}
                <div className="text-right">
                  <span className="text-[9px] text-[#6ca0d4] cursor-pointer hover:text-[#8ec0f4] tracking-wide">
                    Forgot Password?
                  </span>
                </div>

                {/* ENTER BUTTON */}
                <button
                  type="submit"
                  disabled={loading}
                  className="
                    mx-auto px-10 py-3
                    border-2 border-[#555555]
                    bg-[linear-gradient(#373737,#181818)]
                    text-[#f5f5dc] text-sm uppercase tracking-[4px]
                    [text-shadow:1px_1px_#000]
                    shadow-[0_2px_0_#000,0_0_15px_rgba(93,172,255,0.3)]
                    hover:shadow-[0_2px_0_#000,0_0_25px_rgba(93,172,255,0.5)]
                    hover:border-[#7abaff]
                    transition-shadow duration-300
                    cursor-pointer
                    disabled:opacity-50 disabled:cursor-not-allowed
                  "
                >
                  {loading ? "LOADING..." : "ENTER"}
                </button>

                {error && (
                  <p className="text-center text-[10px] text-red-500 tracking-[2px]">
                    {error}
                  </p>
                )}

                {/* AUTHORIZED ONLY */}
                <div className="text-center">
                  <p className="text-[9px] text-[#888] tracking-wide border-t border-[#333] pt-3 inline-block px-4">
                    Authorized Personnel Only!
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* BOTTOM BAR */}
        <div className="flex items-center justify-between border-[3px] border-[#5c5c5c] px-2.5 py-1.5 bg-[linear-gradient(#403b3b,#262020)] [text-shadow:1px_1px_#000] mt-2">
          <Link
            href="/retro"
            className="text-[10px] tracking-[1px] text-[#c0b896] hover:text-[#f0e6d2] transition-colors"
          >
            &larr; BACK TO SITE
          </Link>
          <span className="text-[10px] tracking-[1px] text-[#c0b896]">
            NEED HELP? SUPPORT
          </span>
        </div>
      </div>
    </div>
  );
}
