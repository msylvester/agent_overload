"use client";

import Image from "next/image";
import Link from "next/link";

export default function AgentOnboardingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] font-[family-name:var(--font-inter)] text-[#f5f5dc] flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <div className="mb-8">
        <Image
          src="/fortune.png"
          alt="Krystal Ball Z"
          width={120}
          height={120}
          className="drop-shadow-[0_0_24px_rgba(138,43,226,0.5)] opacity-60"
          priority
        />
      </div>

      {/* Coming Soon */}
      <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-[#f5f5dc] mb-4">
        Coming Soon
      </h1>
      <p className="text-sm md:text-base text-[#8a8a6a] text-center max-w-md mb-8 leading-relaxed">
        Agent onboarding documentation is on the way. Soon your AI agent will be
        able to query the KBZ funding oracle directly.
      </p>

      {/* Back link */}
      <Link
        href="/home"
        className="text-sm text-[#e74c3c] hover:text-[#c0392b] transition-colors"
      >
        &larr; Back to home
      </Link>
    </div>
  );
}
