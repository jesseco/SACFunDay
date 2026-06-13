export const SESSION_COOKIE = "sac-admin-session";

// Session lifetime in seconds (24 hours), matched by the cookie maxAge.
export const SESSION_MAX_AGE = 60 * 60 * 24;

export type Role = "admin" | "marshal";

export type SessionClaims = {
  userId: number;
  role: Role;
};

/**
 * Admin sessions are stateless, signed tokens of the form:
 *
 *     <userId>.<role>.<expiry-epoch-seconds>.<base64url-hmac-sha256>
 *
 * The HMAC is keyed by SESSION_SECRET, so a cookie cannot be forged
 * without the secret even though this repository is public. Tokens
 * carry their own expiry, which is verified on every check.
 *
 * `verifySessionToken` uses only Web Crypto and no database, so it is
 * safe to call from the edge proxy (`proxy.ts`). Password hashing and
 * the DB-backed `getCurrentUser` use Node APIs via dynamic import and
 * must only be called from server actions / server components.
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

function isRole(value: string): value is Role {
  return value === "admin" || value === "marshal";
}

/** Create a signed session token that expires after SESSION_MAX_AGE. */
export async function createSessionToken(
  userId: number,
  role: Role
): Promise<string> {
  const expiry = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE;
  const payload = `${userId}.${role}.${expiry}`;
  const sig = await hmac(payload);
  return `${payload}.${sig}`;
}

/**
 * Verify a token's signature and expiry, returning its claims.
 * Returns null for any missing/malformed/expired/forged token.
 * Web Crypto only — safe in the edge proxy.
 */
export async function verifySessionToken(
  token: string | undefined
): Promise<SessionClaims | null> {
  if (!token) return null;

  const parts = token.split(".");
  if (parts.length !== 4) return null;

  const [userIdStr, role, expiryStr, sig] = parts;
  const payload = `${userIdStr}.${role}.${expiryStr}`;

  const userId = Number(userIdStr);
  const expiry = Number(expiryStr);
  if (!Number.isInteger(userId) || userId <= 0) return null;
  if (!Number.isFinite(expiry) || expiry < Math.floor(Date.now() / 1000)) {
    return null;
  }
  if (!isRole(role)) return null;

  const expected = await hmac(payload);
  if (!timingSafeEqual(sig, expected)) return null;

  return { userId, role };
}

/**
 * Hash a plaintext password with scrypt. Returns "salt:hash" in hex.
 * Node-only (dynamic import keeps node:crypto out of the proxy bundle).
 */
export async function hashPassword(plain: string): Promise<string> {
  const { scrypt, randomBytes } = await import("crypto");
  const salt = randomBytes(16);
  const hash: Buffer = await new Promise((resolve, reject) => {
    scrypt(plain, salt, 64, (err, derived) =>
      err ? reject(err) : resolve(derived)
    );
  });
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

/** Verify a plaintext password against a stored "salt:hash" string. */
export async function verifyPassword(
  plain: string,
  stored: string
): Promise<boolean> {
  const { scrypt, timingSafeEqual: nodeTimingSafeEqual } = await import("crypto");
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;

  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");
  const derived: Buffer = await new Promise((resolve, reject) => {
    scrypt(plain, salt, 64, (err, d) => (err ? reject(err) : resolve(d)));
  });
  if (derived.length !== expected.length) return false;
  return nodeTimingSafeEqual(derived, expected);
}

export type CurrentUser = {
  userId: number;
  role: Role;
  name: string;
  username: string;
};

/**
 * The currently logged-in OC member, or null. Reads the signed cookie,
 * then confirms the user still exists and is active in the database
 * (so deactivating an account takes effect on the next request).
 * Node-only — uses next/headers and the DB.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const claims = await verifySessionToken(
    cookieStore.get(SESSION_COOKIE)?.value
  );
  if (!claims) return null;

  const { db } = await import("./db/client");
  const { users } = await import("./db/schema");
  const { eq } = await import("drizzle-orm");

  const user = await db
    .select()
    .from(users)
    .where(eq(users.id, claims.userId))
    .get();

  if (!user || !user.isActive) return null;

  // Role comes from the live record (a demotion takes effect immediately).
  const role: Role = isRole(user.role) ? user.role : "marshal";
  return { userId: user.id, role, name: user.name, username: user.username };
}

/**
 * Guard for server actions / pages. Returns the current user if they
 * hold the required role, otherwise redirects to login. Pass no role
 * to require only that the user is authenticated.
 */
export async function requireUser(role?: Role): Promise<CurrentUser> {
  const { redirect } = await import("next/navigation");
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?from=/admin");
    throw new Error("unreachable"); // redirect() throws; satisfies the type checker
  }
  if (role && user.role !== role) {
    redirect("/admin");
  }
  return user;
}
