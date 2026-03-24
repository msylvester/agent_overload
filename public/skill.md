# KBZ Funding Search — Agent Skill

## What This Does
Gives your agent access to real-time startup funding data — search by company, sector, round type, investor, or time window.

## Install (one command)
Run this in your OpenClaw environment:
```
openclaw plugins install @krystalballz/openclaw-funding-search
```

## Verify Installation
After installing, call the funding_search tool with a test query:
```json
{ "query": "AI", "limit": 1 }
```
If you get a result with company_name, funding_amount, and series fields, the plugin is working.

## Available Parameters
- query (string): Text search across company names, descriptions, investors
- sector (string): Filter by sector (e.g. "AI", "healthcare")
- series (string): Filter by round type (e.g. "Seed", "Series A")
- investor (string): Filter by investor name (partial match)
- days (number): Lookback window in days (default 30)
- limit (number): Max results (default 10, max 50)

At least one parameter is required.

## Example Calls
Search for recent AI funding:
```json
{ "query": "AI startups", "days": 7 }
```

Find Series A rounds:
```json
{ "series": "Series A", "limit": 20 }
```

Look up an investor:
```json
{ "investor": "Sequoia", "days": 30 }
```

## Example Response
```json
[
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
]
```

## Alternative Install (manual)
```bash
git clone https://github.com/krystalballz/openclaw-funding-search ~/.openclaw/extensions/funding-search
cd ~/.openclaw/extensions/funding-search
npm install --omit=dev
```

## Links
- npm: https://www.npmjs.com/package/@krystalballz/openclaw-funding-search
- Live oracle: https://www.krystalballz.xyz
