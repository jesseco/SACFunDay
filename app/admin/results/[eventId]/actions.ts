'use server';

import { db } from '@/lib/db/client';
import { results, events } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function saveResult(eventId: number, registrationId: number, data: any) {
  const existing = await db
    .select()
    .from(results)
    .where(eq(results.registrationId, registrationId))
    .get();

  const payload = {
    performanceValue: data.performanceValue || null,
    place: data.place ?? null,
    status: data.status || 'ok',
    source: data.source || 'app',
    enteredAt: new Date(),
    enteredBy: data.enteredBy?.trim() || 'OC',  // Now comes from the form input (much better than hardcoded)
  };

  if (existing) {
    await db
      .update(results)
      .set(payload)
      .where(eq(results.registrationId, registrationId));
  } else {
    await db.insert(results).values({
      registrationId,
      ...payload,
    });
  }

  revalidatePath(`/admin/results/${eventId}`);
}

export async function markEventComplete(eventId: number) {
  await db
    .update(events)
    .set({ isComplete: true })
    .where(eq(events.id, eventId));

  revalidatePath('/admin/results');
  revalidatePath(`/admin/results/${eventId}`);
}
