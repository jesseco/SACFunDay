'use server';

import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireUser, hashPassword, type Role } from '@/lib/auth';

const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, 'Username must be at least 3 characters')
  .max(40)
  .regex(/^[a-z0-9._-]+$/, 'Username can only use letters, numbers, dot, dash, underscore');

const createUserSchema = z.object({
  username: usernameSchema,
  name: z.string().trim().min(1, 'Name is required').max(120),
  role: z.enum(['admin', 'marshal']),
  password: z.string().min(8, 'Password must be at least 8 characters').max(200),
});

export async function createUser(formData: FormData) {
  await requireUser('admin');

  const parsed = createUserSchema.safeParse({
    username: formData.get('username'),
    name: formData.get('name'),
    role: formData.get('role'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  }

  const { username, name, role, password } = parsed.data;

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .get();

  if (existing) {
    return { error: 'That username is already taken.' };
  }

  await db.insert(users).values({
    username,
    name,
    role: role as Role,
    passwordHash: await hashPassword(password),
  });

  revalidatePath('/admin/users');
  return {};
}

export async function setUserActive(userId: number, isActive: boolean) {
  const current = await requireUser('admin');

  // An admin cannot deactivate themselves (avoids locking yourself out).
  if (current.userId === userId && !isActive) {
    return { error: 'You cannot deactivate your own account.' };
  }

  await db.update(users).set({ isActive }).where(eq(users.id, userId));
  revalidatePath('/admin/users');
  return {};
}

export async function setUserRole(userId: number, role: Role) {
  const current = await requireUser('admin');

  // An admin cannot demote themselves (keeps at least this admin in place).
  if (current.userId === userId && role !== 'admin') {
    return { error: 'You cannot change your own role.' };
  }

  await db.update(users).set({ role }).where(eq(users.id, userId));
  revalidatePath('/admin/users');
  return {};
}

const resetPasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(200);

export async function resetUserPassword(userId: number, newPassword: string) {
  await requireUser('admin');

  const parsed = resetPasswordSchema.safeParse(newPassword);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid password.' };
  }

  await db
    .update(users)
    .set({ passwordHash: await hashPassword(parsed.data) })
    .where(eq(users.id, userId));

  revalidatePath('/admin/users');
  return {};
}
