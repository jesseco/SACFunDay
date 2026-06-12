"use server";

import { cookies } from "next/headers";
import { SESSION_COOKIE, SESSION_MAX_AGE, createSessionToken } from "@/lib/auth";

export async function verifyPin(formData: FormData): Promise<{ error?: string }> {
  const pin = formData.get("pin") as string;
  const adminPin = process.env.ADMIN_PIN;

  if (!adminPin) {
    return { error: "Admin PIN not configured. Set ADMIN_PIN in environment variables." };
  }

  if (!pin || pin.trim() === "") {
    return { error: "Please enter a PIN." };
  }

  if (pin !== adminPin) {
    return { error: "Incorrect PIN." };
  }

  // Set signed session cookie (expires in 24 hours)
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, await createSessionToken(), {
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
