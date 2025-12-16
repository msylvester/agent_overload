import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { getTemporal } from "./agents/temporal_router_agent";

interface TemporalResponse {
  companies: string[];
  inference: string;
}

/* ============================
   DATE HELPERS
============================ */

function nowISO() {
  return new Date().toISOString();
}

function daysAgoISO(days: number) {
  const d = new Date();
  if (days === 0) {
    d.setHours(0, 1, 0, 0);
    return d.toISOString();
  }
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function monthsAgoISO(months: number) {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return d.toISOString();
}

/* ============================
   TEST DATA
============================ */

const TESTS = [
  {
    desc: "Today",
    q: "Who was funded today?",
    start: daysAgoISO(0),
    end: nowISO(),
    min: 1,
  },
  {
    desc: "Recently funded",
    q: "Who has been funded recently?",
    start: daysAgoISO(7),
    end: nowISO(),
    min: 2,
  },
  {
    desc: "Trending companies",
    q: "What are trending companies?",
    start: monthsAgoISO(1),
    end: nowISO(),
    min: 10,
  },
  {
    desc: "Startup activity",
    q: "Analyze recent startup activity",
    start: monthsAgoISO(6),
    end: nowISO(),
    min: 20,
  },
  {
    desc: "Q1 2024",
    q: "What were the trends in AI startups?",
    start: "2024-01-01",
    end: "2024-03-31",
    min: 3,
  },
  {
    desc: "Full year 2024",
    q: "Analyze fintech companies",
    start: "2024-01-01",
    end: "2024-12-31",
    min: 5,
  },
];

/* ============================
   RUNNER
============================ */

(async () => {
  let passed = 0;

  for (const t of TESTS) {
    const res: TemporalResponse = await getTemporal(t.q, t.start, t.end);
    const ok = res.companies.length >= t.min;

    console.log(`\n${t.desc}`);
    console.log(`Companies: ${res.companies.length} (min ${t.min})`);
    console.log(ok ? "✅ PASS" : "❌ FAIL");

    if (ok) passed++;
  }

  console.log(`\nSummary: ${passed}/${TESTS.length} passed`);
})();
