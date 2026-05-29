'use server';

import { db } from '@/lib/db/client';
import { guardians, participants, registrations, events } from '@/lib/db/schema';
import { eq, like, and, or, isNull } from 'drizzle-orm';
import QRCode from 'qrcode';

type RetrieveInput = {
  phone?: string;
  fullName: string;
  birthYear?: number;
  isForSelf?: boolean;
};

type RetrievedRegistration = {
  participantName: string;
  events: string[];
  qrDataUrl: string;
};

export async function retrieveRegistrations(input: RetrieveInput): Promise<RetrievedRegistration[]> {
  const { phone, fullName, birthYear, isForSelf } = input;

  if (!fullName.trim()) {
    return [];
  }

  const nameQuery = `%${fullName.trim()}%`;

  let participantRows: any[] = [];

  // Strategy 1: Phone + Name (best for families)
  if (phone) {
    const guardian = await db
      .select()
      .from(guardians)
      .where(eq(guardians.phone, phone.trim()))
      .get();

    if (guardian) {
      participantRows = await db
        .select({
          id: participants.id,
          name: participants.name,
          birthYear: participants.birthYear,
          guardianId: participants.guardianId,
          masterCheckinToken: participants.masterCheckinToken,
        })
        .from(participants)
        .where(
          and(
            eq(participants.guardianId, guardian.id),
            like(participants.name, nameQuery)
          )
        );
    }
  }

  // Strategy 2: Name + Birth Year (works for both children and self-registered adults)
  if (participantRows.length === 0 && birthYear) {
    participantRows = await db
      .select({
        id: participants.id,
        name: participants.name,
        birthYear: participants.birthYear,
        guardianId: participants.guardianId,
        masterCheckinToken: participants.masterCheckinToken,
      })
      .from(participants)
      .where(
        and(
          like(participants.name, nameQuery),
          eq(participants.birthYear, birthYear)
        )
      );
  }

  // Strategy 3: Name only (fuzzy, last resort)
  if (participantRows.length === 0) {
    participantRows = await db
      .select({
        id: participants.id,
        name: participants.name,
        birthYear: participants.birthYear,
        guardianId: participants.guardianId,
        masterCheckinToken: participants.masterCheckinToken,
      })
      .from(participants)
      .where(like(participants.name, nameQuery))
      .limit(5); // safety limit
  }

  if (participantRows.length === 0) {
    return [];
  }

  const results: RetrievedRegistration[] = [];

  for (const participant of participantRows) {
    // Get all registrations for this participant
    const participantRegistrations = await db
      .select({
        eventName: events.name,
        checkinToken: registrations.checkinToken,
      })
      .from(registrations)
      .innerJoin(events, eq(registrations.eventId, events.id))
      .where(eq(registrations.participantId, participant.id));

    if (participantRegistrations.length === 0) continue;

    // Generate Master QR code for the participant (one QR per person, not per event)
    const masterToken = participant.masterCheckinToken;
    const qrDataUrl = await QRCode.toDataURL(masterToken, { width: 300 });

    results.push({
      participantName: participant.name,
      events: participantRegistrations.map(r => r.eventName),
      qrDataUrl,
    });
  }

  return results;
}
