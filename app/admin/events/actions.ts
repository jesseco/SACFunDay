'use server';

import { db } from '@/lib/db/client';
import { events } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function createEvent(formData: FormData) {
  const name = formData.get('name') as string;
  const type = formData.get('type') as string;
  const unit = formData.get('unit') as string || null;
  const ageGroupId = parseInt(formData.get('ageGroupId') as string);
  const scheduledTime = formData.get('scheduledTime') as string || null;
  const location = formData.get('location') as string || null;

  if (!name?.trim() || !type || !ageGroupId) {
    throw new Error('Name, type, and age group are required');
  }

  await db.insert(events).values({
    name: name.trim(),
    type,
    unit: unit || null,
    ageGroupId,
    scheduledTime: scheduledTime || null,
    location: location || null,
    isComplete: false,
  });

  revalidatePath('/admin/events');
}

export async function updateEvent(formData: FormData) {
  const id = parseInt(formData.get('id') as string);
  const name = formData.get('name') as string;
  const type = formData.get('type') as string;
  const unit = formData.get('unit') as string || null;
  const ageGroupId = parseInt(formData.get('ageGroupId') as string);
  const scheduledTime = formData.get('scheduledTime') as string || null;
  const location = formData.get('location') as string || null;

  if (!id || !name?.trim() || !type || !ageGroupId) {
    throw new Error('Invalid data');
  }

  await db
    .update(events)
    .set({
      name: name.trim(),
      type,
      unit: unit || null,
      ageGroupId,
      scheduledTime: scheduledTime || null,
      location: location || null,
    })
    .where(eq(events.id, id));

  revalidatePath('/admin/events');
}

export async function deleteEvent(id: number) {
  // Note: In a real app we'd check for existing registrations/results first
  await db.delete(events).where(eq(events.id, id));
  revalidatePath('/admin/events');
}
