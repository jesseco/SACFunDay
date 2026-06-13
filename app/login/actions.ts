"use server";

import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  createSessionToken,
  verifyPassword,
  type Role,
} from "@/lib/auth";

export async function login(formData: FormData): Promise<{ error?: string }> {
  const username = (formData.get("username") as string | null)?.trim().toLowerCase();
  const password = formData.get("password") as string | null;

  if (!username || !password) {
    return { error: "Please enter your username and password." };
  }

  const user = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .get();

  // Generic message either way — don't reveal whether the username exists.
  const invalid = { error: "Invalid username or password." };

  if (!user || !user.isActive) return invalid;

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return invalid;

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, await createSessionToken(user.id, user.role as Role), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });

  return {};
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
