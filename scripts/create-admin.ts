/**
 * Bootstrap the first admin account.
 *
 * Idempotent: if any users already exist, this does nothing. Otherwise it
 * creates a single admin from environment variables, giving you a way into
 * the admin area after a fresh deploy. The other accounts are then created
 * through the UI at /admin/users.
 *
 * Usage:
 *   SEED_ADMIN_USER=jesse SEED_ADMIN_PASSWORD='a-strong-password' \
 *   SEED_ADMIN_NAME='Jesse Co' npx tsx scripts/create-admin.ts
 */
import { db } from "../lib/db/client";
import { users } from "../lib/db/schema";
import { hashPassword } from "../lib/auth";

async function main() {
  const username = (process.env.SEED_ADMIN_USER || "").trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD || "";
  const name = (process.env.SEED_ADMIN_NAME || "Administrator").trim();

  if (!username || !password) {
    console.error(
      "Set SEED_ADMIN_USER and SEED_ADMIN_PASSWORD env vars before running."
    );
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("SEED_ADMIN_PASSWORD must be at least 8 characters.");
    process.exit(1);
  }

  const existing = await db.select().from(users).limit(1).get();
  if (existing) {
    console.log("✓ A user already exists — skipping admin bootstrap.");
    return;
  }

  await db.insert(users).values({
    username,
    name,
    role: "admin",
    passwordHash: await hashPassword(password),
  });

  console.log(`✓ Created admin "${username}". You can now sign in at /login.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
