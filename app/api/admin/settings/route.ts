import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin/session";
import { getSubscriberStats } from "@/lib/db/queries";

export async function GET() {
  const session = await verifyAdminSession();
  if (!session.authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const envVars = {
    ADMIN_USERNAME: !!process.env.ADMIN_USERNAME,
    ADMIN_PASSWORD: !!process.env.ADMIN_PASSWORD,
    ADMIN_SESSION_SECRET: !!process.env.ADMIN_SESSION_SECRET,
    KBZ_CHRON_URL: !!process.env.KBZ_CHRON_URL,
    POSTGRES_URL: !!process.env.POSTGRES_URL,
  };

  const kbzChronUrl = process.env.KBZ_CHRON_URL || "https://kbz-chron.fly.dev";
  const maskedUrl = kbzChronUrl.replace(
    /\/\/([^/]+)/,
    (match) => match.slice(0, 6) + "***",
  );

  // Check kbz_chron connectivity
  let kbzChronConnected = false;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5_000);
    const res = await fetch(`${kbzChronUrl}/health`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    kbzChronConnected = res.ok;
  } catch {
    kbzChronConnected = false;
  }

  // Check database connectivity via a count query
  let dbConnected = false;
  try {
    await getSubscriberStats();
    dbConnected = true;
  } catch {
    dbConnected = false;
  }

  return NextResponse.json({
    envVars,
    kbzChronUrl: maskedUrl,
    kbzChronConnected,
    dbConnected,
  });
}
