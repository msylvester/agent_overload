import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin/session";

const KBZ_CHRON_URL =
  process.env.KBZ_CHRON_URL || "https://kbz-chron.fly.dev";

export async function GET() {
  const session = await verifyAdminSession();
  if (!session.authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    const res = await fetch(`${KBZ_CHRON_URL}/`, {
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      return NextResponse.json(
        { error: "Upstream service error" },
        { status: 502 },
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Failed to reach kbz_chron service" },
      { status: 502 },
    );
  }
}
