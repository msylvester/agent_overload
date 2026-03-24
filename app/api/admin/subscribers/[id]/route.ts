import { NextResponse } from "next/server";
import { deleteSubscriber } from "@/lib/db/queries";
import { verifyAdminSession } from "@/lib/admin/session";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await verifyAdminSession();
  if (!session.authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const deleted = await deleteSubscriber({ id });
    if (!deleted) {
      return NextResponse.json(
        { error: "Subscriber not found" },
        { status: 404 },
      );
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete subscriber" },
      { status: 500 },
    );
  }
}
