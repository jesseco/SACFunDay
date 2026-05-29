'use server';

import { db } from '@/lib/db/client';
import { settings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function updateEventDaySettings(formData: FormData) {
  const eventTitle = formData.get('eventTitle') as string;
  const eventDate = formData.get('eventDate') as string;
  const description = formData.get('description') as string;
  const mainLocation = formData.get('mainLocation') as string;
  const currentOperator = formData.get('currentOperator') as string;

  const portalOpen = formData.get('portalOpen') === 'on';
  const portalOpensAt = formData.get('portalOpensAt') as string || null;
  const portalClosesAt = formData.get('portalClosesAt') as string || null;

  // Get existing settings or create new
  const existing = await db.select().from(settings).limit(1).get();

  const data = {
    eventTitle: eventTitle || 'SAC Fun Day 2026',
    eventDate: eventDate || null,
    // Store operator + other info in notes using a simple convention
    notes: buildNotesField(currentOperator, description, mainLocation),
    portalOpen,
    portalOpensAt: portalOpensAt ? new Date(portalOpensAt) : null,
    portalClosesAt: portalClosesAt ? new Date(portalClosesAt) : null,
    updatedAt: new Date(),
  };

  if (existing) {
    await db.update(settings)
      .set(data)
      .where(eq(settings.id, existing.id));
  } else {
    await db.insert(settings).values({
      ...data,
      churchName: 'St. Augustine\'s Chapel',
    });
  }

  revalidatePath('/admin');
  revalidatePath('/portal');
  revalidatePath('/admin/settings');
}

function buildNotesField(operator: string | null, description: string | null, location: string | null): string | null {
  const parts: string[] = [];

  if (operator?.trim()) {
    parts.push(`OPERATOR: ${operator.trim()}`);
  }

  const otherContent = [description?.trim(), location?.trim()].filter(Boolean).join('\n');

  if (otherContent) {
    if (parts.length > 0) parts.push('---');
    parts.push(otherContent);
  }

  return parts.length > 0 ? parts.join('\n') : null;
}
