'use server';

import { db } from '@/lib/db/client';
import { guardians, participants, registrations, events, ageGroups } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { randomUUID } from 'crypto';

export async function createParticipant(formData: FormData) {
  const childName = formData.get('childName') as string;
  const ageGroupId = parseInt(formData.get('ageGroupId') as string);
  const guardianName = formData.get('guardianName') as string;
  const guardianPhone = formData.get('guardianPhone') as string;
  const guardianEmail = formData.get('guardianEmail') as string || null;
  const bibNumber = formData.get('bibNumber') as string || null;

  if (!childName?.trim() || !ageGroupId || !guardianName?.trim() || !guardianPhone?.trim()) {
    throw new Error('Child name, age group, parent name and phone are required');
  }

  // Create or find guardian
  let guardian = await db
    .select()
    .from(guardians)
    .where(eq(guardians.phone, guardianPhone.trim()))
    .get();

  if (!guardian) {
    guardian = await db
      .insert(guardians)
      .values({
        name: guardianName.trim(),
        phone: guardianPhone.trim(),
        email: guardianEmail,
      })
      .returning()
      .get();
  }

  // Create participant
  const participant = await db
    .insert(participants)
    .values({
      name: childName.trim(),
      guardianId: guardian.id,
      ageGroupId,
      bibNumber: bibNumber || null,
    })
    .returning()
    .get();

  // Auto-register to all events for this age group (practical default)
  const ageGroupEvents = await db
    .select()
    .from(events)
    .where(and(eq(events.ageGroupId, ageGroupId), eq(events.isComplete, false)));

  for (const ev of ageGroupEvents) {
    await db.insert(registrations).values({
      eventId: ev.id,
      participantId: participant.id,
      source: 'manual',
      checkinToken: randomUUID().slice(0, 8),
    }).onConflictDoNothing().run();
  }

  revalidatePath('/admin/participants');
}

export async function deleteParticipant(id: number) {
  // Delete registrations first
  await db.delete(registrations).where(eq(registrations.participantId, id));
  await db.delete(participants).where(eq(participants.id, id));
  revalidatePath('/admin/participants');
}

// Bulk import from CSV data
export async function importParticipantsCSV(rows: any[]) {
  let created = 0;
  let skipped = 0;

  for (const row of rows) {
    const childName = row['Child Name'] || row['child_name'] || row['Name'] || row['name'];
    const ageGroupName = row['Age Group'] || row['age_group'] || row['AgeGroup'];
    const parentName = row['Parent Name'] || row['parent_name'] || row['Guardian'];
    const parentPhone = row['Parent Phone'] || row['parent_phone'] || row['Phone'];
    const parentEmail = row['Parent Email'] || row['parent_email'] || row['Email'] || null;
    const bib = row['Bib'] || row['bib'] || null;

    if (!childName || !ageGroupName || !parentName || !parentPhone) {
      skipped++;
      continue;
    }

    // Find age group
    const ageGroup = await db
      .select()
      .from(ageGroups)
      .where(eq(ageGroups.name, ageGroupName.trim()))
      .get();

    if (!ageGroup) {
      skipped++;
      continue;
    }

    // Find or create guardian
    let guardian = await db
      .select()
      .from(guardians)
      .where(eq(guardians.phone, parentPhone.trim()))
      .get();

    if (!guardian) {
      guardian = await db
        .insert(guardians)
        .values({
          name: parentName.trim(),
          phone: parentPhone.trim(),
          email: parentEmail,
        })
        .returning()
        .get();
    }

    // Create participant
    const participant = await db
      .insert(participants)
      .values({
        name: childName.trim(),
        guardianId: guardian.id,
        ageGroupId: ageGroup.id,
        bibNumber: bib,
      })
      .returning()
      .get();

    // Register to all suitable events
    const suitableEvents = await db
      .select()
      .from(events)
      .where(and(eq(events.ageGroupId, ageGroup.id), eq(events.isComplete, false)));

    for (const ev of suitableEvents) {
      await db.insert(registrations).values({
        eventId: ev.id,
        participantId: participant.id,
        source: 'imported',
        checkinToken: randomUUID().slice(0, 8),
      }).onConflictDoNothing().run();
    }

    created++;
  }

  revalidatePath('/admin/participants');
  return { created, skipped };
}
