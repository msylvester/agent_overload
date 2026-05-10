import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSessionToken,
} from "@/lib/admin-session";
import StatCard from "./_components/stat-card";
import TableBrowser from "./_components/table-browser";
import {
  getCounts,
  getRows,
  PAGE_SIZE,
  TABLES,
  TABLE_NAMES,
  type TableName,
} from "./_lib/admin-data";
import LogoutButton from "./logout-button";

export const dynamic = "force-dynamic";

type SearchParams = {
  table?: string;
  page?: string;
};

function parseTable(value: string | undefined): TableName {
  if (value && (TABLE_NAMES as string[]).includes(value)) {
    return value as TableName;
  }
  return "user";
}

function parsePage(value: string | undefined, total: number): number {
  const parsed = Number.parseInt(value ?? "1", 10);
  const safe = Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  return Math.min(safe, totalPages);
}

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const cookieStore = await cookies();
  const session = verifyAdminSessionToken(
    cookieStore.get(ADMIN_SESSION_COOKIE)?.value,
  );
  if (!session) {
    redirect("/admin");
  }

  const params = await searchParams;
  const table = parseTable(params.table);
  const cfg = TABLES[table];

  const counts = await getCounts();
  const total = counts[table];
  const page = parsePage(params.page, total);
  const rows = await getRows(table, page);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#1c2840_0%,#05040a_70%)] text-[#f0e6d2] p-4 font-[var(--font-press-start),'Press_Start_2P',system-ui,sans-serif]">
      <div className="max-w-6xl mx-auto flex flex-col gap-6">
        <header className="border-4 border-[#2b2b2b] bg-[#141016] shadow-[0_0_0_4px_#4e4e4e,0_0_32px_rgba(0,0,0,0.7)] p-6 flex flex-col gap-4">
          <h1 className="text-sm tracking-[3px] text-[#d4a853] text-center uppercase">
            Admin Dashboard
          </h1>
          <p className="text-[11px] tracking-[1px] text-center">
            Signed in as <span className="text-[#d4a853]">{session.sub}</span>
          </p>
          <LogoutButton />
        </header>

        <section className="flex flex-col gap-3">
          <h2 className="text-[11px] tracking-[2px] text-[#d4a853] uppercase">
            Database
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {TABLE_NAMES.map((name) => (
              <StatCard key={name} label={name} count={counts[name]} />
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-[11px] tracking-[2px] text-[#d4a853] uppercase">
            Browse rows
          </h2>
          <TableBrowser
            table={table}
            columns={cfg.columns}
            rows={rows}
            page={page}
            total={total}
          />
        </section>
      </div>
    </div>
  );
}
