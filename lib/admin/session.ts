import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "admin-session";

function getSecret() {
  const secret =
    process.env.ADMIN_SESSION_SECRET ||
    "default-admin-secret-change-in-production";
  return new TextEncoder().encode(secret);
}

export function createSessionToken(payload: Record<string, unknown>) {
  const secret = getSecret();
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(secret);
}

export async function verifySessionToken(token: string) {
  try {
    const secret = getSecret();
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch {
    return null;
  }
}

export async function verifyAdminSession(): Promise<{
  authenticated: boolean;
}> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(COOKIE_NAME);
    if (!sessionCookie) {
      return { authenticated: false };
    }
    const payload = await verifySessionToken(sessionCookie.value);
    return { authenticated: !!payload };
  } catch {
    return { authenticated: false };
  }
}

export async function getAdminSessionFromRequest(
  request: Request
): Promise<{ authenticated: boolean }> {
  try {
    const cookieHeader = request.headers.get("cookie") ?? "";
    const match = cookieHeader.match(
      new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`)
    );
    if (!match) {
      return { authenticated: false };
    }
    const payload = await verifySessionToken(match[1]);
    return { authenticated: !!payload };
  } catch {
    return { authenticated: false };
  }
}
