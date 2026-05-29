'use server';

import { db } from '@/lib/db/client';
import { guardians, participants, registrations, events } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';
import QRCode from 'qrcode';

const MAX_EVENTS_PER_PERSON = 4;

export type SignupSuccessParticipant = {
  name: string;
  events: string[];
  qrDataUrl: string;
};

export type SignupResult = {
  success: true;
  participants: SignupSuccessParticipant[];
};

export async function submitSignup(formData: FormData): Promise<SignupResult> {
  const guardianName = formData.get('guardianName') as string;
  const guardianPhone = formData.get('guardianPhone') as string;
  const guardianEmail = formData.get('guardianEmail') as string || null;

  const participantsJson = formData.get('participants') as string;
  const participantsList = JSON.parse(participantsJson);

  if (!guardianName || !guardianPhone || !participantsList?.length) {
    throw new Error('Missing required information');
  }

  // Find or create guardian
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

  const createdParticipants: SignupSuccessParticipant[] = [];

  for (const p of participantsList) {
    if (!p.name?.trim()) continue;

    const masterToken = randomUUID();

    // Create participant (guardian_id is set for children, null for adults)
    const participant = await db
      .insert(participants)
      .values({
        name: p.name.trim(),
        guardianId: p.type === 'child' ? guardian.id : null,
        ageGroupId: p.ageGroupId,
        masterCheckinToken: masterToken,
      })
      .returning()
      .get();

    // Enforce max 4 events (defense in depth)
    const selectedEventIds = (p.selectedEvents || []).slice(0, MAX_EVENTS_PER_PERSON);

    for (const eventId of selectedEventIds) {
      await db.insert(registrations).values({
        eventId: Number(eventId),
        participantId: participant.id,
        source: 'portal',
        checkinToken: randomUUID().slice(0, 8),
      }).onConflictDoNothing().run();
    }

    // Fetch the actual event names for this participant (for nice display on success screen)
    const eventRowsRaw = await db
      .select()
      .from(registrations)
      .innerJoin(events, eq(registrations.eventId, events.id))
      .where(eq(registrations.participantId, participant.id));

    const eventNames = eventRowsRaw.map(row => row.events.name);

    // Generate the Master QR code immediately (data URL)
    const qrDataUrl = await QRCode.toDataURL(masterToken, { width: 280, margin: 1 });

    createdParticipants.push({
      name: participant.name,
      events: eventNames,
      qrDataUrl,
    });
  }

  revalidatePath('/admin/participants');

  return {
    success: true,
    participants: createdParticipants,
  };
}
