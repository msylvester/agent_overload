import { ensureAuthenticated } from "@/lib/auth-helpers";
import { getJobById } from "@/lib/db/queries";
import { ChatSDKError } from "@/lib/errors";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Ensure user is authenticated
    await ensureAuthenticated();

    const { id } = await params;

    if (!id) {
      return new ChatSDKError("bad_request:api").toResponse();
    }

    const job = await getJobById({ id });

    if (!job) {
      return Response.json({ error: "Job not found" }, { status: 404 });
    }

    // Return job status
    return Response.json({
      id: job.id,
      status: job.status,
      result: job.status === "completed" ? job.result : undefined,
      error: job.status === "failed" ? job.error : undefined,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    });
  } catch (error) {
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }

    console.error("Error fetching job status:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
