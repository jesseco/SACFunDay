export const SESSION_COOKIE = "sac-admin-session";
export const SESSION_VALUE = "authenticated";

/**
 * Server-side check for an authenticated admin session.
 * Used by the admin layout as defense-in-depth, in addition to the
 * request guard in `proxy.ts` (Next.js's renamed middleware).
 *
 * `next/headers` is imported dynamically so this module's constants
 * can also be imported by `proxy.ts` without pulling a server-only
 * dependency into the proxy bundle.
 */
export async function isAuthenticated(): Promise<boolean> {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value === SESSION_VALUE;
}
