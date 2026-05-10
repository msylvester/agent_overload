import { createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_SESSION_COOKIE = "admin_session";
export const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

type AdminSessionPayload = {
  sub: string;
  iat: number;
  exp: number;
};

function base64url(input: Buffer | string): string {
  return (typeof input === "string" ? Buffer.from(input) : input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromBase64url(input: string): Buffer {
  const pad = input.length % 4 === 0 ? "" : "=".repeat(4 - (input.length % 4));
  return Buffer.from(input.replace(/-/g, "+").replace(/_/g, "/") + pad, "base64");
}

function getSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    throw new Error("ADMIN_SESSION_SECRET is not set");
  }
  return secret;
}

export function createAdminSessionToken(username: string): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: AdminSessionPayload = {
    sub: username,
    iat: now,
    exp: now + ADMIN_SESSION_MAX_AGE_SECONDS,
  };
  const payloadEncoded = base64url(JSON.stringify(payload));
  const sig = createHmac("sha256", getSecret()).update(payloadEncoded).digest();
  return `${payloadEncoded}.${base64url(sig)}`;
}

export function verifyAdminSessionToken(
  token: string | undefined | null,
): AdminSessionPayload | null {
  if (!token) {
    return null;
  }
  const [payloadEncoded, sigEncoded] = token.split(".");
  if (!(payloadEncoded && sigEncoded)) {
    return null;
  }
  const expected = createHmac("sha256", getSecret())
    .update(payloadEncoded)
    .digest();
  const provided = fromBase64url(sigEncoded);
  if (
    expected.length !== provided.length ||
    !timingSafeEqual(expected, provided)
  ) {
    return null;
  }
  let payload: AdminSessionPayload;
  try {
    payload = JSON.parse(fromBase64url(payloadEncoded).toString("utf8"));
  } catch {
    return null;
  }
  if (payload.exp < Math.floor(Date.now() / 1000)) {
    return null;
  }
  return payload;
}

export function checkAdminCredentials(
  username: string,
  password: string,
): boolean {
  const expectedUsername = process.env.ADMIN_USERNAME;
  const expectedPassword = process.env.ADMIN_PASSWORD;
  if (!(expectedUsername && expectedPassword)) {
    return false;
  }
  const u = Buffer.from(username);
  const eu = Buffer.from(expectedUsername);
  const p = Buffer.from(password);
  const ep = Buffer.from(expectedPassword);
  const userOk =
    u.length === eu.length && timingSafeEqual(u, eu);
  const passOk =
    p.length === ep.length && timingSafeEqual(p, ep);
  return userOk && passOk;
}
