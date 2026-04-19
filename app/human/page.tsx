import Image from "next/image";
import Link from "next/link";

function Step({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-[#2b2b2b] rounded-xl bg-[#12121a] p-6">
      <div className="flex items-center gap-3 mb-3">
        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[#e74c3c] text-white text-xs font-bold shrink-0">
          {number}
        </span>
        <h3 className="text-sm font-semibold text-[#f5f5dc]">{title}</h3>
      </div>
      <div className="text-[13px] text-[#b8b8a0] leading-relaxed">
        {children}
      </div>
    </div>
  );
}

export default function HumanPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] font-[family-name:var(--font-inter)] text-[#f5f5dc]">
      {/* Header */}
      <header className="border-b border-[#1c1c2a] bg-[#0a0a0f]/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/home" className="flex items-center gap-3 group">
            <Image
              src="/fortune.png"
              alt="Krystal Ball Z"
              width={32}
              height={32}
              className="drop-shadow-[0_0_12px_rgba(138,43,226,0.4)] opacity-80 group-hover:opacity-100 transition-opacity"
            />
            <span className="text-sm font-semibold text-[#8a8a6a] group-hover:text-[#f5f5dc] transition-colors">
              KBZ
            </span>
          </Link>
          <Link
            href="/home"
            className="text-xs text-[#5c5c5c] hover:text-[#8a8a6a] transition-colors"
          >
            &larr; Back to home
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#1c1c2a] border border-[#2b2b2b] rounded-full text-[10px] text-[#8a8a6a] mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80] inline-block" />
            For Humans
          </div>
          <h1 className="text-2xl md:text-4xl font-bold tracking-tight mb-4">
            How <span className="text-[#e74c3c]">Krystal Ball Z</span> Works
          </h1>
          <p className="text-sm text-[#8a8a6a] max-w-lg mx-auto leading-relaxed">
            KBZ scrapes startup funding news every night and turns it into
            structured data your AI agent can query in plain English.
          </p>
        </div>

        {/* The Flow */}
        <div className="space-y-5">
          <Step number={1} title="Nightly news scrape">
            Every night, KBZ crawls a curated list of startup and venture
            capital news sources. It pulls every new article published in the
            last 24 hours covering funding rounds, investments, and company
            announcements.
          </Step>

          <Step number={2} title="Extract &amp; structure">
            Each article is parsed to pull out the facts that matter — company
            name, sector, funding amount, round type, investors, and the
            publish date — and normalized into a consistent schema.
          </Step>

          <Step number={3} title="Store for agents">
            The extracted rows are written to the KBZ database and indexed
            with vector embeddings. Keyword filters and semantic search both
            sit on top of the same corpus, ready for an agent to query.
          </Step>

          <Step number={4} title="Agents consume it">
            An AI agent installs the KBZ plugin and calls{" "}
            <code className="text-[#c0d8f0] bg-[#1c1c2a] px-1.5 py-0.5 rounded text-[12px]">
              funding_search
            </code>{" "}
            or{" "}
            <code className="text-[#c0d8f0] bg-[#1c1c2a] px-1.5 py-0.5 rounded text-[12px]">
              funding_search_rag
            </code>
            . The agent gets fresh, structured funding data back — no
            scraping, no parsing, no guesswork.
          </Step>
        </div>

        {/* Summary Card */}
        <div className="mt-12 border border-[#e74c3c]/30 rounded-xl bg-[#12121a] p-6 shadow-[0_0_20px_rgba(231,76,60,0.1)]">
          <p className="text-[13px] text-[#b8b8a0] leading-relaxed">
            The short version: <span className="text-[#f5f5dc]">humans ask
            questions, agents get answers.</span> KBZ does the nightly
            ingestion so your agent always has up-to-date funding
            intelligence at hand.
          </p>
        </div>

        {/* Footer CTAs */}
        <div className="mt-12 mb-12 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/agent-onboarding"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#e74c3c] hover:bg-[#c0392b] text-white text-xs rounded-lg transition-all shadow-[0_0_12px_rgba(231,76,60,0.3)]"
          >
            Onboard an Agent
          </Link>
          <Link
            href="/retro"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-[#2b2b2b] hover:border-[#5c5c5c] text-[#8a8a6a] hover:text-[#f5f5dc] text-xs rounded-lg transition-all"
          >
            Ask the Oracle
          </Link>
        </div>
      </main>
    </div>
  );
}
