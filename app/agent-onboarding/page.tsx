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
  const [activeTab, setActiveTab] = useState<"quickstart" | "manual" | "api">(
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
            Install the <code className="text-[#c0d8f0] bg-[#1c1c2a] px-1.5 py-0.5 rounded text-xs">@krystalballz/openclaw-funding-search</code>{" "}
            plugin via OpenClaw and give your AI agent direct access to startup
            funding intelligence.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 p-1 bg-[#12121a] border border-[#2b2b2b] rounded-lg mb-8">
          {(
            [
              { key: "quickstart", label: "Quick Start" },
              { key: "manual", label: "Manual Setup" },
              { key: "api", label: "Direct API" },
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
            <StepCard step={1} title="Install OpenClaw CLI">
              <p>
                OpenClaw is the package manager for AI agent plugins. Install it
                globally first.
              </p>
              <CodeBlock lang="bash">npm install -g openclaw</CodeBlock>
            </StepCard>

            <StepCard step={2} title="Initialize your agent project">
              <p>
                If you haven&apos;t already, initialize OpenClaw in your agent&apos;s
                project directory.
              </p>
              <CodeBlock lang="bash">openclaw init</CodeBlock>
              <p className="text-[11px] text-[#5c5c5c]">
                This creates an <code className="text-[#c0d8f0] bg-[#1c1c2a] px-1 rounded">openclaw.config.json</code> file
                that tracks your installed plugins.
              </p>
            </StepCard>

            <StepCard step={3} title="Install the Funding Search plugin">
              <p>
                Install the KBZ funding search plugin from the OpenClaw
                registry.
              </p>
              <CodeBlock lang="bash">
{`openclaw install @krystalballz/openclaw-funding-search`}
              </CodeBlock>
              <p className="text-[11px] text-[#5c5c5c]">
                Or install from the local extension source if you have access:
              </p>
              <CodeBlock lang="bash">
{`openclaw install --from-path ~/openclaw_source/krystalclaw/extensions/funding-search/`}
              </CodeBlock>
            </StepCard>

            <StepCard step={4} title="Configure your API key">
              <p>
                Set your KBZ API key so the plugin can authenticate requests.
              </p>
              <CodeBlock lang="bash">
{`openclaw config set krystalballz.api_key YOUR_API_KEY`}
              </CodeBlock>
              <p className="text-[11px] text-[#5c5c5c]">
                Don&apos;t have an API key?{" "}
                <Link href="/register" className="text-[#e74c3c] underline">
                  Sign up
                </Link>{" "}
                to get one from your dashboard.
              </p>
            </StepCard>

            <StepCard step={5} title="Register the plugin with your agent">
              <p>
                Add the funding search tool to your agent&apos;s available
                capabilities.
              </p>
              <CodeBlock lang="typescript">
{`import { OpenClaw } from "openclaw";
import fundingSearch from "@krystalballz/openclaw-funding-search";

const openclaw = new OpenClaw();
openclaw.register(fundingSearch);

// The plugin exposes these tools to your agent:
// - funding_search: Query startup funding rounds
// - company_lookup: Get detailed company funding history
// - funding_timeline: Get funding events in a date range`}
              </CodeBlock>
            </StepCard>

            <StepCard step={6} title="Test the integration">
              <p>Verify everything works with a quick test query.</p>
              <CodeBlock lang="typescript">
{`const results = await openclaw.invoke("funding_search", {
  query: "AI companies funded in 2025",
  limit: 5,
});

console.log(results);
// => [{ company: "...", round: "Series A", amount: "$10M", ... }, ...]`}
              </CodeBlock>
            </StepCard>
          </div>
        )}

        {/* Manual Setup Tab */}
        {activeTab === "manual" && (
          <div className="space-y-6">
            <StepCard step={1} title="Add the package dependency">
              <p>
                Install the plugin directly as an npm dependency if you prefer
                not to use the OpenClaw CLI.
              </p>
              <CodeBlock lang="bash">
{`npm install @krystalballz/openclaw-funding-search openclaw`}
              </CodeBlock>
            </StepCard>

            <StepCard step={2} title="Create the plugin configuration">
              <p>
                Create an <code className="text-[#c0d8f0] bg-[#1c1c2a] px-1 rounded">openclaw.config.json</code> in
                your project root.
              </p>
              <CodeBlock lang="json">
{`{
  "plugins": {
    "@krystalballz/openclaw-funding-search": {
      "enabled": true,
      "config": {
        "api_key": "$KRYSTALBALLZ_API_KEY",
        "base_url": "https://krystalballz.xyz/api",
        "timeout_ms": 30000,
        "max_results": 50
      }
    }
  }
}`}
              </CodeBlock>
            </StepCard>

            <StepCard step={3} title="Initialize and use in your agent">
              <p>
                Load the config and wire the plugin into your agent&apos;s tool
                chain.
              </p>
              <CodeBlock lang="typescript">
{`import { OpenClaw } from "openclaw";
import fundingSearch from "@krystalballz/openclaw-funding-search";

const openclaw = new OpenClaw({ configPath: "./openclaw.config.json" });
openclaw.register(fundingSearch);

// Get tool definitions for your LLM framework
const tools = openclaw.getToolDefinitions();

// Example: Pass tools to an Anthropic/OpenAI agent
const response = await llm.chat({
  messages: [...],
  tools: tools,
});`}
              </CodeBlock>
            </StepCard>

            <StepCard step={4} title="Handle tool calls in your agent loop">
              <p>
                When your agent decides to use a funding search tool, route the
                call through OpenClaw.
              </p>
              <CodeBlock lang="typescript">
{`// In your agent's tool execution handler:
async function handleToolCall(name: string, input: Record<string, unknown>) {
  if (openclaw.hasPlugin(name)) {
    return await openclaw.invoke(name, input);
  }
  // ... handle other tools
}`}
              </CodeBlock>
            </StepCard>
          </div>
        )}

        {/* Direct API Tab */}
        {activeTab === "api" && (
          <div className="space-y-6">
            <div className="border border-[#2b2b2b] rounded-xl bg-[#12121a] p-6">
              <p className="text-[13px] text-[#b8b8a0] leading-relaxed mb-4">
                If you prefer to skip OpenClaw entirely, your agent can call the
                KBZ Chat API directly. This is useful for lightweight
                integrations or agents that manage their own HTTP calls.
              </p>
            </div>

            <StepCard step={1} title="Chat API endpoint">
              <p>Send funding queries to the chat endpoint.</p>
              <CodeBlock lang="bash">
{`curl -X POST https://krystalballz.xyz/api/chat \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{
    "id": "agent-session-001",
    "message": {
      "role": "user",
      "parts": [{ "type": "text", "text": "AI companies funded in Q1 2025" }]
    }
  }'`}
              </CodeBlock>
            </StepCard>

            <StepCard step={2} title="Poll for results">
              <p>
                The chat API returns a job ID. Poll the job endpoint for the
                completed response.
              </p>
              <CodeBlock lang="bash">
{`curl https://krystalballz.xyz/api/job/JOB_ID \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
              </CodeBlock>
              <p className="text-[11px] text-[#5c5c5c]">
                Poll every 2 seconds. Jobs typically complete within 10-30
                seconds depending on query complexity.
              </p>
            </StepCard>

            <StepCard step={3} title="Parse the response">
              <p>
                Extract structured funding data from the response message parts.
              </p>
              <CodeBlock lang="typescript">
{`interface FundingResult {
  company: string;
  round: string;
  amount: string;
  date: string;
  investors: string[];
  source_url: string;
}

// The response message parts contain structured data:
// - "text" parts: Natural language summary
// - "data-temporal" parts: Structured funding records
// - "data-research" parts: Detailed company research`}
              </CodeBlock>
            </StepCard>
          </div>
        )}

        {/* Available Tools Reference */}
        <SectionHeading>Available Tools</SectionHeading>
        <div className="grid gap-4">
          {[
            {
              name: "funding_search",
              description:
                "Search for startup funding rounds by keyword, industry, or investor.",
              params: "query: string, limit?: number, filters?: object",
            },
            {
              name: "company_lookup",
              description:
                "Get the complete funding history for a specific company.",
              params: "company_name: string",
            },
            {
              name: "funding_timeline",
              description:
                "Retrieve funding events within a specific date range.",
              params: "start_date: string, end_date: string, sector?: string",
            },
          ].map((tool) => (
            <div
              key={tool.name}
              className="border border-[#2b2b2b] rounded-lg bg-[#12121a] p-4"
            >
              <code className="text-[#e74c3c] text-sm font-mono font-semibold">
                {tool.name}
              </code>
              <p className="text-[12px] text-[#8a8a6a] mt-1">
                {tool.description}
              </p>
              <div className="mt-2 text-[11px] text-[#5c5c5c] font-mono">
                ({tool.params})
              </div>
            </div>
          ))}
        </div>

        {/* Environment Variables */}
        <SectionHeading>Environment Variables</SectionHeading>
        <div className="border border-[#2b2b2b] rounded-xl bg-[#12121a] p-6">
          <div className="space-y-3 font-mono text-[12px]">
            {[
              {
                name: "KRYSTALBALLZ_API_KEY",
                desc: "Your API authentication key",
                required: true,
              },
              {
                name: "KBZ_BASE_URL",
                desc: "API base URL (defaults to https://krystalballz.xyz/api)",
                required: false,
              },
              {
                name: "KBZ_TIMEOUT",
                desc: "Request timeout in ms (default: 30000)",
                required: false,
              },
            ].map((env) => (
              <div
                key={env.name}
                className="flex items-start justify-between gap-4 py-2 border-b border-[#1c1c2a] last:border-0"
              >
                <div>
                  <code className="text-[#c0d8f0]">{env.name}</code>
                  <span className="text-[11px] text-[#5c5c5c] ml-2">
                    {env.desc}
                  </span>
                </div>
                {env.required && (
                  <span className="text-[9px] text-[#e74c3c] bg-[#e74c3c]/10 px-2 py-0.5 rounded-full shrink-0">
                    required
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Quick Reference */}
        <SectionHeading>Quick Reference</SectionHeading>
        <CodeBlock lang="typescript">
{`// Full setup in ~10 lines
import { OpenClaw } from "openclaw";
import fundingSearch from "@krystalballz/openclaw-funding-search";

const oc = new OpenClaw();
oc.register(fundingSearch);

const results = await oc.invoke("funding_search", {
  query: "Series A AI startups",
  limit: 10,
});`}
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
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-[#2b2b2b] hover:border-[#5c5c5c] text-[#8a8a6a] hover:text-[#f5f5dc] text-xs rounded-lg transition-all"
            >
              Get an API Key
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
