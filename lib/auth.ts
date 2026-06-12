export const SESSION_COOKIE = "sac-admin-session";

// Session lifetime in seconds (24 hours), matched by the cookie maxAge.
export const SESSION_MAX_AGE = 60 * 60 * 24;

/**
 * Admin sessions are stateless, signed tokens of the form:
 *
 *     <expiry-epoch-seconds>.<base64url-hmac-sha256>
 *
 * The HMAC is keyed by SESSION_SECRET, so a cookie cannot be forged
 * without the secret even though this repository is public. Tokens
 * carry their own expiry, which is verified on every check.
 *
 * Web Crypto (`crypto.subtle`) is used so the exact same code runs in
 * both the edge proxy (`proxy.ts`) and Node server actions.
 */

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error(
      "SESSION_SECRET is not configured. Set it in environment variables."
    );
  }
  return secret;
}

function bytesToBase64Url(bytes: ArrayBuffer): string {
  const binary = String.fromCharCode(...new Uint8Array(bytes));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmac(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload)
  );
  return bytesToBase64Url(sig);
}

/** Constant-time string comparison to avoid signature timing leaks. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

/** Create a signed session token that expires after SESSION_MAX_AGE. */
export async function createSessionToken(): Promise<string> {
  const expiry = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE;
  const payload = String(expiry);
  const sig = await hmac(payload);
  return `${payload}.${sig}`;
}

/** Verify a token's signature and that it has not expired. */
export async function verifySessionToken(
  token: string | undefined
): Promise<boolean> {
  if (!token) return false;

  const dot = token.indexOf(".");
  if (dot === -1) return false;

  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);

  const expiry = Number(payload);
  if (!Number.isFinite(expiry) || expiry < Math.floor(Date.now() / 1000)) {
    return false;
  }

  const expected = await hmac(payload);
  return timingSafeEqual(sig, expected);
}

/**
 * Server-side check for an authenticated admin session.
 * Used by the admin layout as defense-in-depth, in addition to the
 * request guard in `proxy.ts` (Next.js's renamed middleware).
 *
 * `next/headers` is imported dynamically so this module's helpers can
 * also be imported by `proxy.ts` without pulling a server-only
 * dependency into the proxy bundle.
 */
export async function isAuthenticated(): Promise<boolean> {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  return verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);
}
