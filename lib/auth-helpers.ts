import "server-only";
import { auth } from "@/app/(auth)/auth";
import { createGuestUser } from "@/lib/db/queries";

/**
 * Ensures that a request has an authenticated user.
 * If no session exists, creates a guest user for the request.
 *
 * This is particularly useful for handling unauthenticated requests
 * in incognito/private browsing mode where session cookies may not persist.
 *
 * @returns The user ID to use for the request
 *
 * @example
 * const userId = await ensureAuthenticated();
 * await saveChat({ id, userId, title, visibility });
 */
export async function ensureAuthenticated(): Promise<string> {
  const session = await auth();

  if (session?.user?.id) {
    return session.user.id;
  }

  // No session - create a guest user for this request
  // Note: In incognito mode, the session won't persist across requests,
  // but this prevents the immediate "anonymous" database error
  const [guestUser] = await createGuestUser();

  return guestUser.id;
}
