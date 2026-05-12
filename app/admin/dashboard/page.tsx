import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSessionToken,
} from "@/lib/admin-session";
import LogoutButton from "./logout-button";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const cookieStore = await cookies();
  const session = verifyAdminSessionToken(
    cookieStore.get(ADMIN_SESSION_COOKIE)?.value
  );
  if (!session) {
    redirect("/admin");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#1c2840_0%,#05040a_70%)] p-4 font-[var(--font-press-start),'Press_Start_2P',system-ui,sans-serif] text-[#f0e6d2]">
      <div className="flex w-full max-w-[700px] flex-col gap-6 border-4 border-[#2b2b2b] bg-[#141016] p-6 shadow-[0_0_0_4px_#4e4e4e,0_0_32px_rgba(0,0,0,0.7)]">
        <h1 className="text-center text-[#d4a853] text-sm uppercase tracking-[3px]">
          Admin Dashboard
        </h1>
        <p className="text-center text-[11px] tracking-[1px]">
          Signed in as <span className="text-[#d4a853]">{session.sub}</span>
        </p>
        <Link
          className="mx-auto border-2 border-[#555555] bg-[linear-gradient(#373737,#181818)] px-8 py-2 text-center text-[#f5f5dc] text-xs uppercase tracking-[3px] hover:border-[#7abaff]"
          href="/admin/dashboard/scrape"
        >
          View scrape runs
        </Link>
        <LogoutButton />
      </div>
    </div>
  );
}
