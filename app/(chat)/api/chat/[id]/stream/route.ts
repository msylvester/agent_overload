import { ChatSDKError } from "@/lib/errors";

// Resumable streams are not supported with direct inference implementation
// This endpoint is disabled
export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Return 204 No Content - streaming not supported
  return new Response(null, { status: 204 });
}
