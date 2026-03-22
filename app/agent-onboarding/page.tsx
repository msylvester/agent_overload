"use client";

import Link from "next/link";
import { useState } from "react";

const NAV_SECTIONS = [
  {
    title: "Getting Started",
    items: [
      { id: "overview", label: "Overview" },
      { id: "prereqs", label: "Prerequisites" },
      { id: "quick-start", label: "Quick Start for Agents" },
    ],
  },
  {
    title: "Agent Instructions",
    items: [
      { id: "chat-api", label: "Chat API" },
      { id: "job-polling", label: "Job Polling" },
      { id: "company-lookup", label: "Company Lookup" },
      { id: "query-types", label: "Query Types" },
      { id: "temporal-clarification", label: "Temporal Clarification" },
      { id: "response-parsing", label: "Response Parsing" },
    ],
  },
  {
    title: "Project Background",
    items: [
      { id: "what-is-kbz", label: "What is KBZ?" },
      { id: "data-sources", label: "Data & Sources" },
      { id: "architecture", label: "Architecture" },
    ],
  },
  {
    title: "OpenClaw Integration",
    items: [
      { id: "claude-code-setup", label: "Claude Code Setup" },
      { id: "example-session", label: "Example Session" },
      { id: "tips", label: "Tips & Best Practices" },
    ],
  },
];

function CodeBlock({ children, title }: { children: string; title?: string }) {
  return (
    <div className="my-4 rounded-lg overflow-hidden border border-[#2b2b2b]">
      {title && (
        <div className="bg-[#1a1a2e] px-4 py-2 text-[9px] text-[#5c5c5c] border-b border-[#2b2b2b]">
          {title}
        </div>
      )}
      <pre className="bg-[#0d0d14] p-4 overflow-x-auto text-[10px] leading-relaxed text-[#b8b8a0] font-mono">
        <code>{children}</code>
      </pre>
    </div>
  );
}

function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-4 flex gap-3 rounded-lg border border-[#2b2b2b] bg-[#12121a] p-4 text-[10px] text-[#8a8a6a] leading-relaxed">
      <span className="text-sm shrink-0">&#x24D8;</span>
      <div>{children}</div>
    </div>
  );
}

function SectionHeading({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  return (
    <h2
      id={id}
      className="text-sm md:text-base text-[#f5f5dc] mt-12 mb-4 scroll-mt-8"
    >
      {children}
    </h2>
  );
}

function SubHeading({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  return (
    <h3
      id={id}
      className="text-[11px] md:text-xs text-[#e74c3c] mt-8 mb-3 scroll-mt-8"
    >
      {children}
    </h3>
  );
}

function Paragraph({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] md:text-[11px] text-[#b8b8a0] leading-relaxed mb-4">
      {children}
    </p>
  );
}

export default function AgentOnboardingPage() {
  const [activeSection, setActiveSection] = useState("overview");

  return (
    <div className="min-h-screen bg-[#0a0a0f] font-[family-name:var(--font-press-start)] text-[#f5f5dc]">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 border-b border-[#1c1c2a] bg-[#0a0a0f]/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3">
          <Link
            href="/home"
            className="text-xs text-[#f5f5dc] hover:text-[#e74c3c] transition-colors flex items-center gap-2"
          >
            <span>&#x1F52E;</span> KBZ
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-[9px] text-[#5c5c5c]">
            <span className="text-[#e74c3c]">Agent Onboarding</span>
            <Link
              href="/retro"
              className="hover:text-[#b8b8a0] transition-colors"
            >
              Oracle
            </Link>
          </nav>
        </div>
      </header>

      <div className="max-w-7xl mx-auto flex">
        {/* Sidebar Nav */}
        <aside className="hidden lg:block w-56 shrink-0 border-r border-[#1c1c2a] py-8 pr-4 pl-4 sticky top-12 h-[calc(100vh-3rem)] overflow-y-auto">
          {NAV_SECTIONS.map((section) => (
            <div key={section.title} className="mb-6">
              <p className="text-[8px] text-[#5c5c5c] uppercase tracking-wider mb-2">
                {section.title}
              </p>
              <ul className="space-y-1">
                {section.items.map((item) => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      onClick={() => setActiveSection(item.id)}
                      className={`block text-[9px] py-1 px-2 rounded transition-colors ${
                        activeSection === item.id
                          ? "text-[#e74c3c] bg-[#1c1c2a]"
                          : "text-[#8a8a6a] hover:text-[#b8b8a0]"
                      }`}
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </aside>

        {/* Main Content */}
        <main className="flex-1 px-4 md:px-8 py-8 max-w-3xl">
          {/* Page Header */}
          <p className="text-[9px] text-[#5c5c5c] mb-2">Integrations</p>
          <h1 className="text-lg md:text-xl text-[#f5f5dc] mb-2">
            Agent Onboarding
          </h1>
          <Paragraph>
            Everything you need to onboard your AI agent to Krystal Ball Z.
          </Paragraph>
          <Paragraph>
            If you&apos;re developing with AI, KBZ provides a funding
            intelligence API your agent can query to research startup funding
            rounds, investors, and trends.
          </Paragraph>

          {/* ===== GETTING STARTED ===== */}

          <SectionHeading id="overview">Overview</SectionHeading>
          <Paragraph>
            KBZ (Krystal Ball Z) is an AI-powered startup funding oracle. It
            ingests funding announcements from sources like TechCrunch and
            provides three types of intelligence:
          </Paragraph>
          <ul className="text-[10px] text-[#b8b8a0] list-disc list-inside space-y-2 mb-4 ml-2">
            <li>
              <strong className="text-[#f5f5dc]">Temporal queries</strong> —
              &quot;Who got funded last week?&quot; returns companies, amounts,
              and investors within a date range.
            </li>
            <li>
              <strong className="text-[#f5f5dc]">Research queries</strong> —
              &quot;Tell me about Anysphere&apos;s funding&quot; returns
              deep-dive RAG results on specific companies.
            </li>
            <li>
              <strong className="text-[#f5f5dc]">General queries</strong> —
              &quot;How does Series A work?&quot; returns knowledge-based
              answers.
            </li>
          </ul>

          <SubHeading id="prereqs">Prerequisites</SubHeading>
          <Paragraph>
            No API key is required. KBZ uses guest authentication — your agent
            can start querying immediately. All you need is the base URL:
          </Paragraph>
          <CodeBlock title="Base URL">{`https://www.krystalballz.xyz`}</CodeBlock>
          <InfoBox>
            KBZ is free to use. The oracle allows 10 queries per day per
            session. Your agent can start building immediately.
          </InfoBox>

          <SubHeading id="quick-start">Quick Start for Agents</SubHeading>
          <Paragraph>
            The simplest integration is a three-step flow: send a question, poll
            for the result, then parse the response.
          </Paragraph>
          <CodeBlock title="1. Send a question">{`POST https://www.krystalballz.xyz/api/chat
Content-Type: application/json

{
  "id": "<new-uuid>",
  "message": {
    "id": "<new-uuid>",
    "role": "user",
    "parts": [{ "type": "text", "text": "Who got funded last week?" }]
  },
  "selectedChatModel": "chat-model",
  "selectedVisibilityType": "public"
}`}</CodeBlock>
          <CodeBlock title="2. Poll for results">{`GET https://www.krystalballz.xyz/api/job/<jobId>

// Poll every 1s until status === "completed"
// Response:
{
  "status": "completed",
  "result": { /* ChatMessage with parts[] */ }
}`}</CodeBlock>
          <CodeBlock title="3. Parse the response">{`// The result.parts array contains the answer.
// Check part types:
//   "text"                      → plain text answer
//   "data-temporalClarification" → time range buttons (see below)
//
// Text markers:
//   Contains "**Time Period:**"  → temporal response with company list
//   Contains "**Dragon**"        → research/RAG response (strip marker)
//   Neither                      → basic/general answer`}</CodeBlock>

          {/* ===== AGENT INSTRUCTIONS ===== */}

          <SectionHeading id="chat-api">Chat API</SectionHeading>
          <Paragraph>
            The main endpoint. Submit a user message and receive a job ID for
            async polling.
          </Paragraph>
          <CodeBlock title="POST /api/chat — Request">{`{
  "id": string,                    // Chat UUID (generate one)
  "message": {
    "id": string,                  // Message UUID (generate one)
    "role": "user",
    "parts": [
      {
        "type": "text",
        "text": "your question here"
      }
    ]
  },
  "selectedChatModel": "chat-model",
  "selectedVisibilityType": "public",
  "skipClarification": false,      // Set true after time range selected
  "dateRange": {                   // Required when skipClarification=true
    "start": "2024-03-01",         // ISO date
    "end": "2024-03-22"
  }
}`}</CodeBlock>
          <CodeBlock title="POST /api/chat — Response">{`{
  "success": true,
  "jobId": "uuid-of-background-job",
  "status": "pending"
}`}</CodeBlock>

          <SubHeading id="job-polling">Job Polling</SubHeading>
          <Paragraph>
            After submitting a chat message, poll the job endpoint until the
            status is &quot;completed&quot; or &quot;failed&quot;. Poll every 1
            second, max 120 attempts (2 minutes).
          </Paragraph>
          <CodeBlock title="GET /api/job/:id — Response">{`{
  "id": "job-uuid",
  "status": "pending" | "processing" | "completed" | "failed",
  "result": {                     // Only when status === "completed"
    "id": "message-uuid",
    "role": "assistant",
    "parts": [
      { "type": "text", "text": "..." }
    ]
  },
  "error": "...",                 // Only when status === "failed"
  "createdAt": "ISO timestamp",
  "updatedAt": "ISO timestamp"
}`}</CodeBlock>

          <SubHeading id="company-lookup">Company Lookup</SubHeading>
          <Paragraph>
            After a temporal query returns company names, fetch full details for
            any company.
          </Paragraph>
          <CodeBlock title="GET /api/company/:name — Response">{`{
  "company_name": "Acme Corp",
  "posted_date": "2024-03-15",
  "source": "TechCrunch",
  "founded_year": "2020",
  "description": "AI-powered widget platform...",
  "sector": "Enterprise SaaS",
  "funding_amount": "$50M Series B",
  "total_funding": "$75M",
  "investors": ["Sequoia", "a16z", "Tiger Global"]
}`}</CodeBlock>

          <SubHeading id="query-types">Query Types & Classification</SubHeading>
          <Paragraph>
            KBZ automatically classifies your query into one of four types. The
            classification drives which workflow runs and what response format
            you get.
          </Paragraph>
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-[9px] text-[#b8b8a0] border border-[#2b2b2b]">
              <thead>
                <tr className="bg-[#12121a] text-[#f5f5dc]">
                  <th className="text-left p-2 border-b border-[#2b2b2b]">
                    Type
                  </th>
                  <th className="text-left p-2 border-b border-[#2b2b2b]">
                    Trigger Keywords
                  </th>
                  <th className="text-left p-2 border-b border-[#2b2b2b]">
                    Example
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-[#1c1c2a]">
                  <td className="p-2 text-[#e74c3c]">Temporal</td>
                  <td className="p-2">
                    &quot;last week&quot;, &quot;this year&quot;, &quot;Q1
                    2024&quot;, &quot;since March&quot;, month names
                  </td>
                  <td className="p-2">
                    &quot;Who got funded in January?&quot;
                  </td>
                </tr>
                <tr className="border-b border-[#1c1c2a]">
                  <td className="p-2 text-[#e74c3c]">Research</td>
                  <td className="p-2">
                    Specific company/entity names, no time constraint
                  </td>
                  <td className="p-2">
                    &quot;Tell me about Stripe&apos;s funding&quot;
                  </td>
                </tr>
                <tr className="border-b border-[#1c1c2a]">
                  <td className="p-2 text-[#e74c3c]">Advice</td>
                  <td className="p-2">Personal context, &quot;my&quot;, &quot;I&quot;</td>
                  <td className="p-2">
                    &quot;What investors would fund my SaaS?&quot;
                  </td>
                </tr>
                <tr>
                  <td className="p-2 text-[#e74c3c]">Basic</td>
                  <td className="p-2">General questions (default)</td>
                  <td className="p-2">
                    &quot;How does Series A work?&quot;
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <SubHeading id="temporal-clarification">
            Temporal Clarification Gate
          </SubHeading>
          <Paragraph>
            Temporal queries always trigger a clarification step. The first
            response will contain a{" "}
            <code className="text-[#e74c3c] bg-[#1c1c2a] px-1 rounded">
              data-temporalClarification
            </code>{" "}
            part asking the user to pick a time range. Your agent must handle
            this two-step flow:
          </Paragraph>
          <CodeBlock title="Step 1: Initial response (clarification)">{`// result.parts will contain:
{
  "type": "data-temporalClarification",
  "data": {
    "originalQuery": "Who got funded last week?",
    "detectedTimePhrase": "last week",
    "message": "THE ORACLE REQUIRES A TIME BOUNDARY",
    "fields": [{
      "name": "time_range",
      "label": "Choose a time range",
      "type": "buttons",
      "options": [
        { "id": "last_3_days",  "label": "Last 3 days"  },
        { "id": "last_7_days",  "label": "Last 7 days"  },
        { "id": "last_30_days", "label": "Last 30 days" }
      ]
    }]
  }
}`}</CodeBlock>
          <CodeBlock title="Step 2: Re-submit with chosen range">{`POST /api/chat
{
  "id": "<same-chat-id>",
  "message": {
    "id": "<new-uuid>",
    "role": "user",
    "parts": [{ "type": "text", "text": "Who got funded last week?" }]
  },
  "selectedChatModel": "chat-model",
  "selectedVisibilityType": "public",
  "skipClarification": true,
  "dateRange": {
    "start": "2024-03-15",
    "end": "2024-03-22"
  }
}`}</CodeBlock>

          <SubHeading id="response-parsing">Response Parsing</SubHeading>
          <Paragraph>
            After polling completes, parse the result to determine the response
            type:
          </Paragraph>
          <CodeBlock title="Parsing logic">{`function parseKBZResponse(result) {
  const parts = result.parts;

  // Check for temporal clarification (needs user input)
  const clarification = parts.find(
    p => p.type === "data-temporalClarification"
  );
  if (clarification) {
    return { type: "clarification", data: clarification.data };
  }

  // Get text content
  const text = parts
    .filter(p => p.type === "text")
    .map(p => p.text)
    .join("");

  // Temporal response: company list + analysis
  if (text.includes("**Time Period:**")) {
    return { type: "temporal", text };
  }

  // Research response: RAG deep-dive
  if (text.includes("**Dragon**")) {
    return { type: "research", text: text.replace("**Dragon**", "") };
  }

  // Basic/general answer
  return { type: "basic", text };
}`}</CodeBlock>

          {/* ===== PROJECT BACKGROUND ===== */}

          <SectionHeading id="what-is-kbz">What is KBZ?</SectionHeading>
          <Paragraph>
            Krystal Ball Z is an AI-powered startup funding oracle. It answers
            the question &quot;Who got funded?&quot; by ingesting funding
            announcements, structuring them into a searchable database, and
            providing natural language access through an API and retro-themed UI.
          </Paragraph>
          <Paragraph>
            The project is built by Mike S (@MikeS47896459) and lives at{" "}
            <code className="text-[#e74c3c] bg-[#1c1c2a] px-1 rounded">
              krystalballz.xyz
            </code>
            . The human-facing interface is at{" "}
            <code className="text-[#e74c3c] bg-[#1c1c2a] px-1 rounded">
              /retro
            </code>{" "}
            — a pixel-art fortune teller with characters like the Dwarf
            (basic answers), Prince (temporal data), and Dragon (research).
          </Paragraph>

          <SubHeading id="data-sources">Data & Sources</SubHeading>
          <Paragraph>
            KBZ maintains a MongoDB collection of funded companies. Each record
            includes:
          </Paragraph>
          <ul className="text-[10px] text-[#b8b8a0] list-disc list-inside space-y-1 mb-4 ml-2">
            <li>Company name, sector, and founded year</li>
            <li>Funding amount and total funding raised</li>
            <li>Investor names</li>
            <li>Source (e.g., TechCrunch) and posted date</li>
            <li>Description of the company and round</li>
            <li>Vector embeddings for semantic search</li>
          </ul>
          <Paragraph>
            Data is sourced primarily from TechCrunch and company announcements.
            Temporal queries filter by{" "}
            <code className="text-[#e74c3c] bg-[#1c1c2a] px-1 rounded">
              posted_date
            </code>{" "}
            in YYYY-MM-DD format. Research queries use vector similarity search
            against embeddings.
          </Paragraph>

          <SubHeading id="architecture">Architecture</SubHeading>
          <Paragraph>
            The system uses an orchestrator workflow that classifies intent and
            routes to specialized agents:
          </Paragraph>
          <CodeBlock title="Workflow architecture">{`User Query
  │
  ├─ classifyIntent() ──► "time"     ──► Temporal Agent
  │                                        ├─ Date extraction (LLM)
  │                                        ├─ MongoDB date range query
  │                                        └─ Trend analysis (Claude)
  │
  ├─ classifyIntent() ──► "research" ──► RAG Agent
  │                                        ├─ Query rewriting
  │                                        ├─ Vector search (MongoDB Atlas)
  │                                        └─ Answer generation
  │
  └─ classifyIntent() ──► "basic"    ──► Basic Agent
                                           └─ Direct LLM response

Stack:
  • Next.js 15 (App Router)     • MongoDB Atlas (data + vectors)
  • PostgreSQL (chat/job state) • OpenRouter (LLM gateway)
  • Vercel (hosting + edge)     • NextAuth v5 (auth)`}</CodeBlock>

          {/* ===== OPENCLAW INTEGRATION ===== */}

          <SectionHeading id="claude-code-setup">
            Claude Code (OpenClaw) Setup
          </SectionHeading>
          <Paragraph>
            To integrate KBZ into a Claude Code session, give Claude these
            instructions. No MCP server or API key is needed — just HTTP
            requests.
          </Paragraph>
          <CodeBlock title="Paste into Claude Code or CLAUDE.md">{`## KBZ Integration — Startup Funding Oracle

To query startup funding data, use the KBZ API at krystalballz.xyz:

### How to query:
1. POST to /api/chat with your question
2. Poll GET /api/job/<jobId> every 1s until completed
3. Parse the response parts

### Request format:
curl -X POST https://www.krystalballz.xyz/api/chat \\
  -H "Content-Type: application/json" \\
  -d '{
    "id": "'$(uuidgen)'",
    "message": {
      "id": "'$(uuidgen)'",
      "role": "user",
      "parts": [{"type":"text","text":"Who got funded last week?"}]
    },
    "selectedChatModel": "chat-model",
    "selectedVisibilityType": "public"
  }'

### Temporal queries (time-based):
- First response will ask for time range clarification
- Re-submit with skipClarification: true and dateRange: {start, end}
- Dates use ISO format: YYYY-MM-DD

### Company details:
- GET /api/company/<url-encoded-name> for full funding details

### Response types:
- "data-temporalClarification" part → pick a time range, re-submit
- Text with "**Time Period:**" → temporal results with companies
- Text with "**Dragon**" → research/RAG results (strip marker)
- Plain text → general answer`}</CodeBlock>

          <SubHeading id="example-session">Example Session</SubHeading>
          <Paragraph>
            Here is what a full Claude Code integration flow looks like, from
            question to parsed answer:
          </Paragraph>
          <CodeBlock title="Example: temporal query in Claude Code">{`# Step 1: Ask the oracle
CHAT_ID=$(uuidgen)
MSG_ID=$(uuidgen)

RESPONSE=$(curl -s -X POST https://www.krystalballz.xyz/api/chat \\
  -H "Content-Type: application/json" \\
  -d '{
    "id": "'$CHAT_ID'",
    "message": {
      "id": "'$MSG_ID'",
      "role": "user",
      "parts": [{"type":"text","text":"Who raised funding in March 2024?"}]
    },
    "selectedChatModel": "chat-model",
    "selectedVisibilityType": "public"
  }')

JOB_ID=$(echo $RESPONSE | jq -r '.jobId')

# Step 2: Poll for result
while true; do
  RESULT=$(curl -s https://www.krystalballz.xyz/api/job/$JOB_ID)
  STATUS=$(echo $RESULT | jq -r '.status')
  if [ "$STATUS" = "completed" ]; then break; fi
  sleep 1
done

# Step 3: Check if clarification needed
# If result contains temporalClarification, re-submit with dateRange

# Step 4: Re-submit with explicit date range
MSG_ID2=$(uuidgen)
RESPONSE2=$(curl -s -X POST https://www.krystalballz.xyz/api/chat \\
  -H "Content-Type: application/json" \\
  -d '{
    "id": "'$CHAT_ID'",
    "message": {
      "id": "'$MSG_ID2'",
      "role": "user",
      "parts": [{"type":"text","text":"Who raised funding in March 2024?"}]
    },
    "selectedChatModel": "chat-model",
    "selectedVisibilityType": "public",
    "skipClarification": true,
    "dateRange": {"start":"2024-03-01","end":"2024-03-31"}
  }')

JOB_ID2=$(echo $RESPONSE2 | jq -r '.jobId')

# Step 5: Poll again for final results
while true; do
  RESULT2=$(curl -s https://www.krystalballz.xyz/api/job/$JOB_ID2)
  STATUS2=$(echo $RESULT2 | jq -r '.status')
  if [ "$STATUS2" = "completed" ]; then break; fi
  sleep 1
done

# Result now contains company list, funding amounts, and analysis`}</CodeBlock>

          <SubHeading id="tips">Tips & Best Practices</SubHeading>
          <ul className="text-[10px] text-[#b8b8a0] space-y-3 mb-8 ml-2">
            <li className="flex gap-2">
              <span className="text-[#e74c3c] shrink-0">1.</span>
              <span>
                <strong className="text-[#f5f5dc]">
                  Always handle the clarification gate.
                </strong>{" "}
                Temporal queries will always return a clarification first. Your
                agent must detect this and re-submit with{" "}
                <code className="text-[#e74c3c] bg-[#1c1c2a] px-1 rounded">
                  skipClarification: true
                </code>{" "}
                and a{" "}
                <code className="text-[#e74c3c] bg-[#1c1c2a] px-1 rounded">
                  dateRange
                </code>
                .
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-[#e74c3c] shrink-0">2.</span>
              <span>
                <strong className="text-[#f5f5dc]">
                  Generate fresh UUIDs.
                </strong>{" "}
                Each chat and message needs a unique UUID. Reuse the same{" "}
                <code className="text-[#e74c3c] bg-[#1c1c2a] px-1 rounded">
                  chat id
                </code>{" "}
                for follow-ups within a conversation.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-[#e74c3c] shrink-0">3.</span>
              <span>
                <strong className="text-[#f5f5dc]">
                  Poll with a 1s interval.
                </strong>{" "}
                Jobs typically complete in 5–30 seconds. Max timeout is 2
                minutes (120 polls).
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-[#e74c3c] shrink-0">4.</span>
              <span>
                <strong className="text-[#f5f5dc]">
                  Use /api/company/:name for details.
                </strong>{" "}
                Temporal responses return company names only. Fetch full funding
                details (investors, amounts, sector) separately.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-[#e74c3c] shrink-0">5.</span>
              <span>
                <strong className="text-[#f5f5dc]">
                  Strip response markers.
                </strong>{" "}
                Research responses end with{" "}
                <code className="text-[#e74c3c] bg-[#1c1c2a] px-1 rounded">
                  **Dragon**
                </code>
                . Strip this before displaying to users.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-[#e74c3c] shrink-0">6.</span>
              <span>
                <strong className="text-[#f5f5dc]">Rate limit: 10/day.</strong>{" "}
                Each session gets 10 queries per day. Plan your agent&apos;s
                queries accordingly.
              </span>
            </li>
          </ul>

          {/* Back to home */}
          <div className="border-t border-[#1c1c2a] pt-8 mt-12">
            <Link
              href="/home"
              className="text-[10px] text-[#e74c3c] hover:text-[#c0392b] transition-colors"
            >
              ← Back to home
            </Link>
          </div>
        </main>

        {/* Right sidebar — Table of Contents (desktop only) */}
        <aside className="hidden xl:block w-48 shrink-0 py-8 pl-4 sticky top-12 h-[calc(100vh-3rem)] overflow-y-auto">
          <p className="text-[8px] text-[#5c5c5c] uppercase tracking-wider mb-3">
            On this page
          </p>
          <ul className="space-y-1">
            {NAV_SECTIONS.flatMap((section) =>
              section.items.map((item) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    className="block text-[8px] py-0.5 text-[#5c5c5c] hover:text-[#b8b8a0] transition-colors"
                  >
                    {item.label}
                  </a>
                </li>
              ))
            )}
          </ul>
        </aside>
      </div>
    </div>
  );
}
