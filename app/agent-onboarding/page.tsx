"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="absolute top-2 right-2 px-2 py-1 text-[10px] bg-[#2b2b2b] hover:bg-[#3b3b3b] text-[#8a8a6a] rounded transition-colors cursor-pointer"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

function CodeBlock({ children, lang }: { children: string; lang?: string }) {
  return (
    <div className="relative group">
      <CopyButton text={children} />
      {lang && (
        <span className="absolute top-2 left-3 text-[9px] text-[#5c5c5c] uppercase tracking-wider">
          {lang}
        </span>
      )}
      <pre className="bg-[#1c1c2a] rounded-lg p-4 pt-8 overflow-x-auto text-[12px] leading-relaxed font-mono text-[#c0d8f0] border border-[#2b2b2b]">
        <code>{children}</code>
      </pre>
    </div>
  );
}

function StepCard({
  step,
  title,
  children,
}: {
  step: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-[#2b2b2b] rounded-xl bg-[#12121a] p-6">
      <div className="flex items-center gap-3 mb-4">
        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[#e74c3c] text-white text-xs font-bold shrink-0">
          {step}
        </span>
        <h3 className="text-sm font-semibold text-[#f5f5dc]">{title}</h3>
      </div>
      <div className="space-y-4 text-[13px] text-[#b8b8a0] leading-relaxed">
        {children}
      </div>
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-lg font-bold text-[#f5f5dc] mt-12 mb-6 flex items-center gap-2">
      {children}
    </h2>
  );
}

export default function AgentOnboardingPage() {
  const [activeTab, setActiveTab] = useState<"quickstart" | "manual">(
    "quickstart"
  );

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

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 py-10">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#1c1c2a] border border-[#2b2b2b] rounded-full text-[10px] text-[#8a8a6a] mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80] inline-block" />
            Agent Integration Guide
          </div>
          <h1 className="text-2xl md:text-4xl font-bold tracking-tight mb-4">
            Connect Your Agent to{" "}
            <span className="text-[#e74c3c]">Krystal Ball Z</span>
          </h1>
          <p className="text-sm text-[#8a8a6a] max-w-lg mx-auto leading-relaxed">
            Install the{" "}
            <a
              href="https://www.npmjs.com/package/@krystalballz/openclaw-funding-search"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#c0d8f0] bg-[#1c1c2a] px-1.5 py-0.5 rounded text-xs hover:text-[#e74c3c] transition-colors"
            >
              @krystalballz/openclaw-funding-search
            </a>{" "}
            plugin via OpenClaw. One command, then the{" "}
            <code className="text-[#c0d8f0] bg-[#1c1c2a] px-1.5 py-0.5 rounded text-xs">funding_search</code>{" "}
            tool is automatically available to your agent.
          </p>
        </div>

        {/* Agent Skill File */}
        <div className="border border-[#e74c3c]/30 rounded-xl bg-[#12121a] p-6 mb-10 shadow-[0_0_20px_rgba(231,76,60,0.1)]">
          <h2 className="text-sm font-bold text-[#f5f5dc] mb-2">
            For AI Agents: Read the Skill File
          </h2>
          <p className="text-[12px] text-[#8a8a6a] mb-4">
            Point your agent to this URL. It will fetch the instructions, install
            the plugin, and verify it works — autonomously.
          </p>
          <div className="relative">
            <CopyButton text="https://www.krystalballz.xyz/skill.md" />
            <div className="bg-[#1c1c2a] rounded-lg px-4 py-3 pr-20 text-[13px] font-mono text-[#c0d8f0] border border-[#2b2b2b]">
              https://www.krystalballz.xyz/skill.md
            </div>
          </div>
          <div className="mt-4 flex items-start gap-3 text-[11px] text-[#5c5c5c]">
            <span className="shrink-0 mt-0.5">How it works:</span>
            <span>
              Agent fetches skill.md &rarr; reads install command &rarr; runs{" "}
              <code className="text-[#c0d8f0] bg-[#1c1c2a] px-1 rounded">
                openclaw plugins install
              </code>{" "}
              &rarr; verifies with a test query &rarr; ready to use
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 p-1 bg-[#12121a] border border-[#2b2b2b] rounded-lg mb-8">
          {(
            [
              { key: "quickstart", label: "Quick Start" },
              { key: "manual", label: "Manual Setup" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 px-4 py-2 text-xs rounded-md transition-all cursor-pointer ${
                activeTab === tab.key
                  ? "bg-[#e74c3c] text-white shadow-[0_0_12px_rgba(231,76,60,0.3)]"
                  : "text-[#5c5c5c] hover:text-[#8a8a6a]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Quick Start Tab */}
        {activeTab === "quickstart" && (
          <div className="space-y-6">
            <StepCard step={1} title="Install the plugin">
              <p>
                Install the funding search plugin from the OpenClaw registry.
                This is all you need.
              </p>
              <CodeBlock lang="bash">openclaw plugins install @krystalballz/openclaw-funding-search</CodeBlock>
              <p className="text-[11px] text-[#5c5c5c]">
                The <code className="text-[#c0d8f0] bg-[#1c1c2a] px-1 rounded">funding_search</code>{" "}
                tool is automatically available to all agents after installation.
                No registration code needed.
              </p>
            </StepCard>

            <StepCard step={2} title="Configure API key (optional)">
              <p>
                If you have an API key for authenticated access, add it to your{" "}
                <code className="text-[#c0d8f0] bg-[#1c1c2a] px-1 rounded">openclaw.json</code>.
              </p>
              <CodeBlock lang="json">
{`{
  "plugins": {
    "funding-search": {
      "apiKey": "your-api-key"
    }
  }
}`}
              </CodeBlock>
              <p className="text-[11px] text-[#5c5c5c]">
                The plugin works without an API key. Authenticated access is
                reserved for future premium features.
              </p>
            </StepCard>

            <StepCard step={3} title="Use it">
              <p>
                Your agent can now call <code className="text-[#c0d8f0] bg-[#1c1c2a] px-1 rounded">funding_search</code>{" "}
                with any combination of parameters.
              </p>
              <CodeBlock lang="json">
{`{ "query": "autonomous vehicles", "sector": "AI", "limit": 5 }`}
              </CodeBlock>
              <p className="text-[11px] text-[#5c5c5c]">
                At least one parameter is required. See the full parameter
                reference below.
              </p>
            </StepCard>
          </div>
        )}

        {/* Manual Setup Tab */}
        {activeTab === "manual" && (
          <div className="space-y-6">
            <StepCard step={1} title="Clone into your extensions directory">
              <p>
                Clone the plugin repo directly into your local OpenClaw
                extensions folder.
              </p>
              <CodeBlock lang="bash">
{`git clone https://github.com/krystalballz/openclaw-funding-search ~/.openclaw/extensions/funding-search
cd ~/.openclaw/extensions/funding-search
npm install --omit=dev`}
              </CodeBlock>
            </StepCard>

            <StepCard step={2} title="Configure API key (optional)">
              <p>
                Add an optional API key in your{" "}
                <code className="text-[#c0d8f0] bg-[#1c1c2a] px-1 rounded">openclaw.json</code>{" "}
                plugin config.
              </p>
              <CodeBlock lang="json">
{`{
  "plugins": {
    "funding-search": {
      "apiKey": "your-api-key"
    }
  }
}`}
              </CodeBlock>
            </StepCard>

            <StepCard step={3} title="Verify the tool is available">
              <p>
                The plugin registers itself automatically via{" "}
                <code className="text-[#c0d8f0] bg-[#1c1c2a] px-1 rounded">openclaw.plugin.json</code>.
                No manual registration code is needed. The{" "}
                <code className="text-[#c0d8f0] bg-[#1c1c2a] px-1 rounded">funding_search</code>{" "}
                tool will be available to all agents immediately.
              </p>
            </StepCard>
          </div>
        )}

        {/* Tool Reference */}
        <SectionHeading>Tool Reference: funding_search</SectionHeading>
        <div className="border border-[#2b2b2b] rounded-xl bg-[#12121a] p-6">
          <p className="text-[13px] text-[#b8b8a0] mb-4">
            Search the KrystalBallz startup funding database for companies,
            investors, and funding rounds. At least one parameter is required.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-[#2b2b2b]">
                  <th className="text-left py-2 pr-4 text-[#f5f5dc] font-semibold">Parameter</th>
                  <th className="text-left py-2 pr-4 text-[#f5f5dc] font-semibold">Type</th>
                  <th className="text-left py-2 text-[#f5f5dc] font-semibold">Description</th>
                </tr>
              </thead>
              <tbody className="text-[#b8b8a0]">
                {[
                  { name: "query", type: "string", desc: "Text search across company names, descriptions, investors" },
                  { name: "sector", type: "string", desc: 'Filter by sector (e.g. "AI", "healthcare")' },
                  { name: "series", type: "string", desc: 'Filter by round type (e.g. "Seed", "Series A")' },
                  { name: "investor", type: "string", desc: "Filter by investor name (partial match)" },
                  { name: "start_date", type: "string", desc: "Start of date range, inclusive (YYYY-MM-DD)" },
                  { name: "end_date", type: "string", desc: "End of date range, inclusive (YYYY-MM-DD)" },
                  { name: "days", type: "number", desc: "Lookback window in days from today (alternative to date range)" },
                  { name: "limit", type: "number", desc: "Max results (default 10, max 50)" },
                ].map((param) => (
                  <tr key={param.name} className="border-b border-[#1c1c2a] last:border-0">
                    <td className="py-2 pr-4">
                      <code className="text-[#c0d8f0] font-mono">{param.name}</code>
                    </td>
                    <td className="py-2 pr-4">
                      <code className="text-[#5c5c5c] font-mono">{param.type}</code>
                    </td>
                    <td className="py-2 text-[#8a8a6a]">{param.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Example Queries */}
        <SectionHeading>Example Queries</SectionHeading>
        <div className="space-y-4">
          <div>
            <p className="text-[12px] text-[#8a8a6a] mb-2">Search by text:</p>
            <CodeBlock lang="json">{`{ "query": "autonomous vehicles" }`}</CodeBlock>
          </div>
          <div>
            <p className="text-[12px] text-[#8a8a6a] mb-2">Filter by sector and series:</p>
            <CodeBlock lang="json">{`{ "sector": "AI", "series": "Series A" }`}</CodeBlock>
          </div>
          <div>
            <p className="text-[12px] text-[#8a8a6a] mb-2">Find a specific investor&apos;s deals in the last 7 days:</p>
            <CodeBlock lang="json">{`{ "investor": "Sequoia", "days": 7, "limit": 20 }`}</CodeBlock>
          </div>
          <div>
            <p className="text-[12px] text-[#8a8a6a] mb-2">Funding in a specific month:</p>
            <CodeBlock lang="json">{`{ "start_date": "2026-02-01", "end_date": "2026-02-28", "limit": 50 }`}</CodeBlock>
          </div>
          <div>
            <p className="text-[12px] text-[#8a8a6a] mb-2">Investor activity in Q1 2026:</p>
            <CodeBlock lang="json">{`{ "investor": "Sequoia", "start_date": "2026-01-01", "end_date": "2026-03-31" }`}</CodeBlock>
          </div>
        </div>

        {/* Example Response */}
        <SectionHeading>Example Response</SectionHeading>
        <CodeBlock lang="json">
{`[
  {
    "company_name": "Waabi",
    "funding_amount": "$750M",
    "series": "Series C",
    "sector": "Autonomous Vehicles",
    "investors": "Khosla Ventures, Uber",
    "date": "2026-02-02",
    "source": "TechStartups",
    "description": "Waabi, an autonomous driving technology company..."
  }
]`}
        </CodeBlock>

        {/* Footer CTA */}
        <div className="mt-16 mb-12 text-center border border-[#2b2b2b] rounded-xl bg-[#12121a] p-8">
          <p className="text-sm text-[#f5f5dc] font-semibold mb-2">
            Need help with integration?
          </p>
          <p className="text-[12px] text-[#5c5c5c] mb-6">
            Reach out to our team or try the oracle yourself.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/retro"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#e74c3c] hover:bg-[#c0392b] text-white text-xs rounded-lg transition-all shadow-[0_0_12px_rgba(231,76,60,0.3)]"
            >
              Try the Oracle
            </Link>
            <a
              href="https://www.npmjs.com/package/@krystalballz/openclaw-funding-search"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-[#2b2b2b] hover:border-[#5c5c5c] text-[#8a8a6a] hover:text-[#f5f5dc] text-xs rounded-lg transition-all"
            >
              View on npm
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
