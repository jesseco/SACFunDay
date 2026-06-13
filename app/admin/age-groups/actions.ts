'use server';

import { db } from '@/lib/db/client';
import { ageGroups } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth';

export async function createAgeGroup(formData: FormData) {
  await requireUser('admin');
  const name = formData.get('name') as string;
  const sortOrder = parseInt(formData.get('sortOrder') as string) || 0;

  if (!name?.trim()) {
    throw new Error('Name is required');
  }

  await db.insert(ageGroups).values({
    name: name.trim(),
    sortOrder,
  });

  revalidatePath('/admin/age-groups');
}

export async function updateAgeGroup(formData: FormData) {
  await requireUser('admin');
  const id = parseInt(formData.get('id') as string);
  const name = formData.get('name') as string;
  const sortOrder = parseInt(formData.get('sortOrder') as string) || 0;

  if (!id || !name?.trim()) {
    throw new Error('Invalid data');
  }

  await db
    .update(ageGroups)
    .set({
      name: name.trim(),
      sortOrder,
    })
    .where(eq(ageGroups.id, id));

  revalidatePath('/admin/age-groups');
}

export async function deleteAgeGroup(id: number) {
  await requireUser('admin');
  // TODO: In future, prevent deletion if events or participants exist
  await db.delete(ageGroups).where(eq(ageGroups.id, id));
  revalidatePath('/admin/age-groups');
}
