import { getSubscribers } from "@/lib/db/queries";
import { verifyAdminSession } from "@/lib/admin/session";

export async function GET() {
  const session = await verifyAdminSession();
  if (!session.authenticated) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const subscribers = await getSubscribers();
    const today = new Date().toISOString().split("T")[0];

    const header = "email,agreedToTos,createdAt";
    const rows = subscribers.map(
      (s) =>
        `"${s.email.replace(/"/g, '""')}",${s.agreedToTos},${s.createdAt}`,
    );
    const csv = [header, ...rows].join("\n");

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename=subscribers-${today}.csv`,
      },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Failed to export" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
