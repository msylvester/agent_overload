import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  formatDateTime,
  formatDuration,
  formatKeyValueEntries,
  formatMs,
  formatNumber,
  getRecentScrapeSessions,
  getScrapeDocumentsForSession,
  getScrapeSessionById,
  type ScrapeSession,
} from "@/lib/admin-scrape";
import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSessionToken,
} from "@/lib/admin-session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SHELL_CLASS =
  "min-h-screen flex items-start justify-center bg-[radial-gradient(circle_at_top,#1c2840_0%,#05040a_70%)] text-[#f0e6d2] p-4 font-[var(--font-press-start),'Press_Start_2P',system-ui,sans-serif]";
const PANEL_CLASS =
  "max-w-[1100px] w-full border-4 border-[#2b2b2b] bg-[#141016] shadow-[0_0_0_4px_#4e4e4e,0_0_32px_rgba(0,0,0,0.7)] p-6 flex flex-col gap-6";
const SUBPANEL_CLASS = "border-2 border-[#3a3a3a] bg-[#0c0a0e] p-4";

function outcomeBadgeClass(outcome?: string): string {
  switch (outcome) {
    case "inserted":
      return "border-transparent bg-emerald-900/60 text-emerald-200";
    case "updated":
      return "border-transparent bg-sky-900/60 text-sky-200";
    case "skipped":
      return "border-transparent bg-zinc-700/60 text-zinc-200";
    case "failed":
    case "error":
      return "border-transparent bg-red-900/60 text-red-200";
    default:
      return "border-[#5c5c5c] text-[#c0b896]";
  }
}

function sessionLabel(session: ScrapeSession): string {
  return formatDateTime(
    session.created_at ?? session.finished_at ?? session.started_at
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-2 border-2 border-[#3a3a3a] bg-[#0c0a0e] p-3">
      <span className="text-[#8a8270] text-[8px] uppercase tracking-[1px]">
        {label}
      </span>
      <span className="break-words font-mono text-[#f0e6d2] text-sm">
        {value}
      </span>
    </div>
  );
}

function KeyValueSection({
  title,
  entries,
}: {
  title: string;
  entries: Array<{ key: string; value: string }>;
}) {
  if (entries.length === 0) {
    return null;
  }
  return (
    <details className={SUBPANEL_CLASS}>
      <summary className="cursor-pointer text-[#d4a853] text-[10px] uppercase tracking-[2px]">
        {title}
      </summary>
      <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1 font-mono text-xs sm:grid-cols-2">
        {entries.map((entry) => (
          <div
            className="flex justify-between gap-3 border-[#221f26] border-b py-1"
            key={entry.key}
          >
            <dt className="text-[#8a8270]">{entry.key}</dt>
            <dd className="text-right text-[#f0e6d2]">{entry.value}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}

const DOC_NUMERIC_COLUMNS: Array<{
  label: string;
  key: "classify_ms" | "extract_ms" | "enrich_ms" | "embed_ms" | "store_ms";
}> = [
  { label: "classify", key: "classify_ms" },
  { label: "extract", key: "extract_ms" },
  { label: "enrich", key: "enrich_ms" },
  { label: "embed", key: "embed_ms" },
  { label: "store", key: "store_ms" },
];

export default async function ScrapeRunsPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string | string[] }>;
}) {
  const cookieStore = await cookies();
  const session = verifyAdminSessionToken(
    cookieStore.get(ADMIN_SESSION_COOKIE)?.value
  );
  if (!session) {
    redirect("/admin");
  }

  const { session_id: rawSessionId } = await searchParams;
  const requestedSessionId = Array.isArray(rawSessionId)
    ? rawSessionId[0]
    : rawSessionId;

  const sessions = await getRecentScrapeSessions(25);
  const selectedSessionId = requestedSessionId ?? sessions[0]?.session_id;
  const selected = selectedSessionId
    ? (sessions.find((s) => s.session_id === selectedSessionId) ??
        (await getScrapeSessionById(selectedSessionId))) ||
      null
    : null;
  const documents = selectedSessionId
    ? await getScrapeDocumentsForSession(selectedSessionId)
    : [];

  const timingEntries = formatKeyValueEntries(selected?.timings_ms);
  const perSourceEntries = formatKeyValueEntries(selected?.per_source);

  return (
    <div className={SHELL_CLASS}>
      <div className={PANEL_CLASS}>
        <div className="flex flex-col gap-2 border-[#3a3a3a] border-b-2 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-[#d4a853] text-sm uppercase tracking-[3px]">
            Scrape Runs
          </h1>
          <div className="flex items-center gap-4 font-mono text-[#8a8270] text-[10px]">
            <span>
              Signed in as <span className="text-[#d4a853]">{session.sub}</span>
            </span>
            <Link
              className="text-[#6ca0d4] hover:text-[#8ec0f4]"
              href="/admin/dashboard"
            >
              &larr; Dashboard
            </Link>
          </div>
        </div>

        {sessions.length === 0 ? (
          <div className={SUBPANEL_CLASS}>
            <p className="font-mono text-[#c0b896] text-xs">
              No scrape runs found yet.
            </p>
          </div>
        ) : (
          <>
            <section className="flex flex-col gap-3">
              <h2 className="text-[#8a8270] text-[10px] uppercase tracking-[2px]">
                Recent runs
              </h2>
              <div className="flex max-h-[260px] flex-col gap-2 overflow-y-auto pr-1">
                {sessions.map((s) => {
                  const isSelected = s.session_id === selectedSessionId;
                  return (
                    <Link
                      className={`block border-2 p-3 font-mono text-xs transition-colors ${
                        isSelected
                          ? "border-[#d4a853] bg-[#1a1510]"
                          : "border-[#3a3a3a] bg-[#0c0a0e] hover:border-[#5c5c5c]"
                      }`}
                      href={`/admin/dashboard/scrape?session_id=${encodeURIComponent(
                        s.session_id
                      )}`}
                      key={s.session_id}
                    >
                      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                        <span className="text-[#f0e6d2]">
                          {sessionLabel(s)}
                        </span>
                        <span className="text-[#8a8270]">
                          {s.trigger ?? "—"}
                          {s.sources && s.sources.length > 0
                            ? ` · ${s.sources.join(", ")}`
                            : ""}
                        </span>
                      </div>
                      <div className="mt-1 text-[#a89f88]">
                        {formatNumber(s.document_count)} docs ·{" "}
                        {formatNumber(s.companies_inserted)} ins ·{" "}
                        {formatNumber(s.companies_updated)} upd ·{" "}
                        {formatNumber(s.companies_skipped)} skip ·{" "}
                        {formatNumber(s.companies_failed)} fail ·{" "}
                        {formatNumber(s.errors)} err
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>

            {selected ? (
              <>
                <section className="flex flex-col gap-3">
                  <h2 className="text-[#8a8270] text-[10px] uppercase tracking-[2px]">
                    Run summary
                  </h2>
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    <StatCard label="Trigger" value={selected.trigger ?? "—"} />
                    <StatCard
                      label="Sources"
                      value={
                        selected.sources && selected.sources.length > 0
                          ? selected.sources.join(", ")
                          : "—"
                      }
                    />
                    <StatCard
                      label="Cutoff days"
                      value={formatNumber(selected.cutoff_days)}
                    />
                    <StatCard
                      label="Total duration"
                      value={formatDuration(selected.total_duration_ms)}
                    />
                    <StatCard
                      label="Started"
                      value={formatDateTime(selected.started_at)}
                    />
                    <StatCard
                      label="Finished"
                      value={formatDateTime(selected.finished_at)}
                    />
                    <StatCard
                      label="Documents"
                      value={formatNumber(selected.document_count)}
                    />
                    <StatCard
                      label="Articles found"
                      value={formatNumber(selected.articles_found)}
                    />
                    <StatCard
                      label="Articles classified in"
                      value={formatNumber(selected.articles_classified_in)}
                    />
                    <StatCard
                      label="Companies extracted"
                      value={formatNumber(selected.companies_extracted)}
                    />
                    <StatCard
                      label="Companies inserted"
                      value={formatNumber(selected.companies_inserted)}
                    />
                    <StatCard
                      label="Companies updated"
                      value={formatNumber(selected.companies_updated)}
                    />
                    <StatCard
                      label="Companies skipped"
                      value={formatNumber(selected.companies_skipped)}
                    />
                    <StatCard
                      label="Companies failed"
                      value={formatNumber(selected.companies_failed)}
                    />
                    <StatCard
                      label="Errors"
                      value={formatNumber(selected.errors)}
                    />
                    <StatCard
                      label="Failed upserts"
                      value={formatNumber(selected.failed_upserts)}
                    />
                  </div>
                </section>

                {(timingEntries.length > 0 || perSourceEntries.length > 0) && (
                  <section className="flex flex-col gap-3">
                    <KeyValueSection
                      entries={timingEntries}
                      title="Timings (ms)"
                    />
                    <KeyValueSection
                      entries={perSourceEntries}
                      title="Per-source"
                    />
                  </section>
                )}

                <section className="flex flex-col gap-3">
                  <h2 className="text-[#8a8270] text-[10px] uppercase tracking-[2px]">
                    Documents ({documents.length})
                  </h2>
                  <div className="max-h-[60vh] overflow-auto border-2 border-[#3a3a3a]">
                    <table className="w-full border-collapse font-mono text-xs">
                      <thead className="sticky top-0 z-10 bg-[#0c0a0e] text-[#8a8270]">
                        <tr className="text-left">
                          <th className="px-3 py-2">Source</th>
                          <th className="px-3 py-2">Company</th>
                          <th className="px-3 py-2">Article</th>
                          <th className="px-3 py-2">Posted</th>
                          <th className="px-3 py-2">Outcome</th>
                          {DOC_NUMERIC_COLUMNS.map((col) => (
                            <th className="px-3 py-2 text-right" key={col.key}>
                              {col.label}
                            </th>
                          ))}
                          <th className="px-3 py-2 text-right">total</th>
                          <th className="px-3 py-2">Error</th>
                        </tr>
                      </thead>
                      <tbody>
                        {documents.length === 0 ? (
                          <tr>
                            <td
                              className="px-3 py-4 text-[#8a8270]"
                              colSpan={6 + DOC_NUMERIC_COLUMNS.length + 1}
                            >
                              No documents recorded for this run.
                            </td>
                          </tr>
                        ) : (
                          documents.map((doc) => (
                            <tr
                              className="border-[#221f26] border-t align-top text-[#d4cdb9]"
                              key={doc._id.toString()}
                            >
                              <td className="whitespace-nowrap px-3 py-2">
                                {doc.source ?? "—"}
                              </td>
                              <td className="px-3 py-2">
                                {doc.company_name ?? "—"}
                              </td>
                              <td className="max-w-[280px] truncate px-3 py-2">
                                {doc.url ? (
                                  <a
                                    className="text-[#6ca0d4] hover:text-[#8ec0f4]"
                                    href={doc.url}
                                    rel="noreferrer"
                                    target="_blank"
                                    title={doc.article_title ?? doc.url}
                                  >
                                    {doc.article_title ?? doc.url}
                                  </a>
                                ) : (
                                  (doc.article_title ?? "—")
                                )}
                              </td>
                              <td className="whitespace-nowrap px-3 py-2">
                                {doc.posted_date ?? "—"}
                              </td>
                              <td className="px-3 py-2">
                                <Badge
                                  className={outcomeBadgeClass(doc.outcome)}
                                  variant="outline"
                                >
                                  {doc.outcome ?? "—"}
                                </Badge>
                              </td>
                              {DOC_NUMERIC_COLUMNS.map((col) => (
                                <td
                                  className="whitespace-nowrap px-3 py-2 text-right text-[#a89f88]"
                                  key={col.key}
                                >
                                  {formatMs(doc[col.key])}
                                </td>
                              ))}
                              <td className="whitespace-nowrap px-3 py-2 text-right font-bold text-[#f0e6d2]">
                                {formatMs(doc.total_ms)}
                              </td>
                              <td className="max-w-[220px] truncate px-3 py-2 text-[#ff6b6b]">
                                {doc.error ? (
                                  <span title={doc.error}>{doc.error}</span>
                                ) : (
                                  "—"
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              </>
            ) : (
              <div className={SUBPANEL_CLASS}>
                <p className="font-mono text-[#c0b896] text-xs">
                  Run not found
                  {requestedSessionId
                    ? ` for session_id "${requestedSessionId}"`
                    : ""}
                  . Pick one from the list above.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
