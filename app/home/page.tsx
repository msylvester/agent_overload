"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function HomePage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center font-[family-name:var(--font-press-start)] text-[#f5f5dc]">
      {/* Hero Section */}
      <div className="flex flex-col items-center pt-12 pb-6 px-4 max-w-2xl w-full">
        {/* Logo / Mascot */}
        <div className="mb-8">
          <Image
            src="/fortune.png"
            alt="Krystal Ball Z"
            width={160}
            height={160}
            className="drop-shadow-[0_0_24px_rgba(138,43,226,0.5)]"
            priority
          />
        </div>

        {/* Title */}
        <h1 className="text-2xl md:text-3xl text-center leading-relaxed mb-4">
          Who Got Funded?{" "}
          <span className="text-[#e74c3c]">Find Out.</span>
        </h1>

        {/* Subtitle */}
        <p className="text-xs md:text-sm text-center text-[#b8b8a0] leading-relaxed mb-10 max-w-lg">
          AI-powered startup funding intelligence.{" "}
          <span className="underline decoration-[#e74c3c]">
            Humans ask questions. Agents get answers.
          </span>
        </p>

        {/* Two CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-12">
          <button
            type="button"
            onClick={() => router.push("/retro")}
            className="flex items-center gap-2 px-6 py-3 bg-[#e74c3c] hover:bg-[#c0392b] text-white text-xs rounded-lg transition-all duration-200 shadow-[0_0_16px_rgba(231,76,60,0.4)] hover:shadow-[0_0_24px_rgba(231,76,60,0.6)] cursor-pointer"
          >
            <span>🧙</span>
            <span>I&apos;m a Human</span>
          </button>
          <button
            type="button"
            onClick={() => router.push("/agent-onboarding")}
            className="flex items-center gap-2 px-6 py-3 bg-transparent border border-[#5c5c5c] hover:border-[#8a8a6a] text-[#b8b8a0] hover:text-[#f5f5dc] text-xs rounded-lg transition-all duration-200 cursor-pointer"
          >
            <span>🤖</span>
            <span>I&apos;m an Agent</span>
          </button>
        </div>

        {/* Agent Instruction Card */}
        <div className="w-full max-w-lg border border-[#2b2b2b] rounded-xl bg-[#12121a] p-6 mb-8">
          <p className="text-xs text-center text-[#b8b8a0] mb-4 font-bold">
            Send Your AI Agent to KBZ 🔮
          </p>
          <div className="bg-[#1c1c2a] rounded-lg p-4 mb-4 font-mono text-[10px] text-[#8a8a6a] leading-relaxed">
            Go to krystalballz.xyz/agent-onboarding
            <br />
            and follow the instructions to integrate
            <br />
            your agent with KBZ
          </div>
          <ol className="text-[10px] text-[#5c5c5c] space-y-1 list-decimal list-inside">
            <li>Read the agent onboarding docs</li>
            <li>Point your agent at the Chat API</li>
            <li>Get structured funding data back</li>
          </ol>
        </div>

        {/* Secondary Link */}
        <p className="text-[10px] text-[#5c5c5c] mb-12">
          🧙 Don&apos;t have an agent?{" "}
          <button
            type="button"
            onClick={() => router.push("/retro")}
            className="text-[#e74c3c] underline hover:text-[#c0392b] cursor-pointer bg-transparent border-none font-[family-name:var(--font-press-start)] text-[10px]"
          >
            Ask the oracle yourself →
          </button>
        </p>
      </div>

      {/* Divider */}
      <div className="w-full max-w-lg border-t border-[#1c1c2a] mb-8" />

      {/* Email Signup */}
      <div className="flex flex-col items-center px-4 pb-16 max-w-lg w-full">
        <p className="text-[10px] text-[#4ade80] mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#4ade80] inline-block" />
          Be the first to know what&apos;s coming next
        </p>
        <div className="flex w-full gap-2 mb-3">
          <input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 px-4 py-3 bg-[#12121a] border border-[#2b2b2b] rounded-lg text-[10px] text-[#f5f5dc] placeholder-[#5c5c5c] outline-none focus:border-[#e74c3c] transition-colors"
          />
          <button
            type="button"
            disabled={!email || !agreed}
            className="px-4 py-3 bg-[#2b2b2b] text-[#5c5c5c] text-[10px] rounded-lg disabled:opacity-50 hover:bg-[#3b3b3b] transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            Notify me
          </button>
        </div>
        <label className="flex items-start gap-2 text-[8px] text-[#5c5c5c] cursor-pointer">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 accent-[#e74c3c]"
          />
          <span>
            By checking this box, I agree to the{" "}
            <span className="underline">Terms of Service</span> and acknowledge
            the <span className="underline">Privacy Policy</span>.
          </span>
        </label>
      </div>
    </div>
  );
}
