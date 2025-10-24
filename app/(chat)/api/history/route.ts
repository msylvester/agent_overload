import type { NextRequest } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { getChatsByUserId, deleteAllChatsByUserId } from "@/lib/db/queries";
import { ChatSDKError } from "@/lib/errors";
import { ensureAuthenticated } from "@/lib/auth-helpers";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const limit = Number.parseInt(searchParams.get("limit") || "10", 10);
  const startingAfter = searchParams.get("starting_after");
  const endingBefore = searchParams.get("ending_before");

  if (startingAfter && endingBefore) {
    return new ChatSDKError(
      "bad_request:api",
      "Only one of starting_after or ending_before can be provided."
    ).toResponse();
  }

  const userId = await ensureAuthenticated();

  const chats = await getChatsByUserId({
    id: userId,
    limit,
    startingAfter,
    endingBefore,
  });

  return Response.json(chats);
}

export async function DELETE() {
  const userId = await ensureAuthenticated();

  const result = await deleteAllChatsByUserId({ userId });

  return Response.json(result, { status: 200 });
}
