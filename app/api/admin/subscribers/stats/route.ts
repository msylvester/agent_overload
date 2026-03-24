import { NextResponse } from "next/server";
import {
  getSubscriberDailySignups,
  getSubscriberStats,
} from "@/lib/db/queries";
import { verifyAdminSession } from "@/lib/admin/session";

export async function GET() {
  const session = await verifyAdminSession();
  if (!session.authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [stats, daily] = await Promise.all([
      getSubscriberStats(),
      getSubscriberDailySignups(14),
    ]);

    return NextResponse.json({ ...stats, daily });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 },
    );
  }
}
