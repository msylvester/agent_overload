import { config } from "dotenv";
import path from "path";
import fs from "fs";
import { getCollection, closeConnection } from "./mongoPool";

// Load environment variables from .env.local
config({ path: path.resolve(__dirname, "../.env.local") });

const COLLECTION = "funded_companies";

const CSV_COLUMNS = [
  "_id",
  "company_name",
  "funding_amount",
  "round",
  "article_url",
  "article_slug",
  "article_date",
  "source",
  "ingested_at",
  "created_at",
  "updated_at",
  "valuation",
  "investors",
  "description",
  "sector",
  "founded_year",
  "total_funding",
  "useInRag",
];

// Fields stored as ISO strings vs BSON dates
const STRING_DATE_FIELDS = ["article_date", "ingested_at"];
const BSON_DATE_FIELDS = ["created_at", "updated_at"];

interface ExportConfig {
  dateField: string;
  outputFile: string;
}

const EXPORTS: ExportConfig[] = [
  { dateField: "article_date", outputFile: "thirty_days_article_date.csv" },
  { dateField: "ingested_at", outputFile: "thirty_days_ingested_at.csv" },
  { dateField: "created_at", outputFile: "thirty_days_created_at.csv" },
  { dateField: "updated_at", outputFile: "thirty_days_updated_at.csv" },
];

function escapeCSV(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = typeof value === "object" ? JSON.stringify(value) : String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCSVRow(doc: Record<string, unknown>): string {
  return CSV_COLUMNS.map((col) => escapeCSV(doc[col])).join(",");
}

async function exportForDateField({ dateField, outputFile }: ExportConfig) {
  const collection = await getCollection(COLLECTION);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // String fields compare as ISO strings, BSON date fields compare as Date objects
  const gte = STRING_DATE_FIELDS.includes(dateField)
    ? thirtyDaysAgo.toISOString().slice(0, 10) // "YYYY-MM-DD"
    : thirtyDaysAgo;

  const query = { [dateField]: { $gte: gte } };

  console.log(`Querying ${dateField} >= ${gte} ...`);
  const docs = await collection
    .find(query, { projection: { embedding: 0 } })
    .toArray();

  const header = CSV_COLUMNS.join(",");
  const rows = docs.map((doc) => toCSVRow(doc as Record<string, unknown>));
  const csv = [header, ...rows].join("\n");

  const outPath = path.resolve(__dirname, "..", outputFile);
  fs.writeFileSync(outPath, csv, "utf-8");
  console.log(`  → ${outputFile}: ${docs.length} rows`);
}

async function main() {
  try {
    for (const cfg of EXPORTS) {
      await exportForDateField(cfg);
    }
    console.log("\nDone. All 4 CSVs written.");
  } finally {
    await closeConnection();
  }
}

main();
