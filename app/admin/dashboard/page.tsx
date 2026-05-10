import { cookies } from "next/headers";
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
    cookieStore.get(ADMIN_SESSION_COOKIE)?.value,
  );
  if (!session) {
    redirect("/admin");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top,#1c2840_0%,#05040a_70%)] text-[#f0e6d2] p-4 font-[var(--font-press-start),'Press_Start_2P',system-ui,sans-serif]">
      <div className="max-w-[700px] w-full border-4 border-[#2b2b2b] bg-[#141016] shadow-[0_0_0_4px_#4e4e4e,0_0_32px_rgba(0,0,0,0.7)] p-6 flex flex-col gap-6">
        <h1 className="text-sm tracking-[3px] text-[#d4a853] text-center uppercase">
          Admin Dashboard
        </h1>
        <p className="text-[11px] tracking-[1px] text-center">
          Signed in as <span className="text-[#d4a853]">{session.sub}</span>
        </p>
        <LogoutButton />
      </div>
    </div>
  );
}
