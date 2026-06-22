'use server';

import { db } from '@/lib/db/client';
import { guardians, participants, registrations, events } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';
import QRCode from 'qrcode';
import { z } from 'zod';
import { put } from '@vercel/blob';

const MAX_EVENTS_PER_PERSON = 4;

const participantSchema = z.object({
  type: z.enum(['adult', 'child']),
  name: z.string().trim().min(1, 'Participant name is required').max(120),
  ageGroupId: z.coerce.number().int().positive('Age group is required'),
  selectedEvents: z
    .array(z.coerce.number().int().positive())
    .max(MAX_EVENTS_PER_PERSON, `Maximum ${MAX_EVENTS_PER_PERSON} events per person`)
    .default([]),
});

const signupSchema = z.object({
  guardianName: z.string().trim().min(1, 'Your name is required').max(120),
  guardianPhone: z.string().trim().min(3, 'A phone number is required').max(40),
  guardianEmail: z
    .union([z.string().trim().email('Invalid email address'), z.literal('')])
    .nullish()
    .transform((v) => (v ? v : null)),
  participants: z
    .array(participantSchema)
    .min(1, 'At least one participant is required')
    .max(20, 'Too many participants in one submission'),
});

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
  const participantsJson = formData.get('participants');

  let rawParticipants: unknown;
  try {
    rawParticipants = JSON.parse(
      typeof participantsJson === 'string' ? participantsJson : '[]'
    );
  } catch {
    throw new Error('Invalid participant data.');
  }

  const parsed = signupSchema.safeParse({
    guardianName: formData.get('guardianName'),
    guardianPhone: formData.get('guardianPhone'),
    guardianEmail: formData.get('guardianEmail'),
    participants: rawParticipants,
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Invalid submission.');
  }

  const {
    guardianName,
    guardianPhone,
    guardianEmail,
    participants: participantsList,
  } = parsed.data;

  const lunchCountStr = formData.get('lunchCount') as string | null;
  const lunchAttendees = lunchCountStr ? parseInt(lunchCountStr, 10) || 0 : 0;

  const paymentFile = formData.get('paymentProof') as File | null;

  // Find or create guardian
  let guardian = await db
    .select()
    .from(guardians)
    .where(eq(guardians.phone, guardianPhone))
    .get();

  // Require payment proof for new sign-ups (or if no previous proof on file)
  if (!paymentFile && (!guardian || !guardian.paymentProof)) {
    throw new Error('Please upload proof of the $20 payment (per family).');
  }

  let paymentProofUrl: string | null = null;
  if (paymentFile && paymentFile instanceof File && paymentFile.size > 0) {
    // Upload to Vercel Blob Storage
    const filename = `payment-proof/${guardianPhone.replace(/\s+/g, '')}-${Date.now()}-${paymentFile.name}`;
    const blob = await put(filename, paymentFile, {
      access: 'public',
      addRandomSuffix: false,
    });
    paymentProofUrl = blob.url;
  }

  if (!guardian) {
    guardian = await db
      .insert(guardians)
      .values({
        name: guardianName.trim(),
        phone: guardianPhone.trim(),
        email: guardianEmail,
        lunchAttendees,
        paymentProof: paymentProofUrl,
      })
      .returning()
      .get();
  } else {
    // Update existing guardian's lunch and payment info
    await db
      .update(guardians)
      .set({
        lunchAttendees,
        paymentProof: paymentProofUrl ?? guardian.paymentProof,
      })
      .where(eq(guardians.id, guardian.id))
      .run();
  }

  const createdParticipants: SignupSuccessParticipant[] = [];

  for (const p of participantsList) {
    const masterToken = randomUUID();

    // Create participant (guardian_id is set for children, null for adults)
    const participant = await db
      .insert(participants)
      .values({
        name: p.name,
        guardianId: p.type === 'child' ? guardian.id : null,
        ageGroupId: p.ageGroupId,
        masterCheckinToken: masterToken,
      })
      .returning()
      .get();

    // Enforce max events (defense in depth; schema already caps this)
    const selectedEventIds = p.selectedEvents.slice(0, MAX_EVENTS_PER_PERSON);

    for (const eventId of selectedEventIds) {
      await db.insert(registrations).values({
        eventId,
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
