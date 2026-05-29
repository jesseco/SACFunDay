'use server';

import { db } from '@/lib/db/client';
import { results, events } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function saveResult(eventId: number, registrationId: number, data: Record<string, unknown>) {
  const existing = await db
    .select()
    .from(results)
    .where(eq(results.registrationId, registrationId))
    .get();

  const payload = {
    performanceValue: (data.performanceValue as string) || null,
    place: (data.place as number) ?? null,
    status: (data.status as string) || 'ok',
    source: (data.source as string) || 'app',
    enteredAt: new Date(),
    enteredBy: (typeof data.enteredBy === 'string' ? data.enteredBy.trim() : null) || 'OC',
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
