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
      const rows = await db
        .select()
        .from(participants)
        .where(
          and(
            eq(participants.guardianId, guardian.id),
            like(participants.name, nameQuery)
          )
        );
      participantRows = rows.map(r => ({
        id: r.id,
        name: r.name,
        birthYear: r.birthYear,
        guardianId: r.guardianId,
        masterCheckinToken: r.masterCheckinToken,
      }));
    }
  }

  // Strategy 2: Name + Birth Year (works for both children and self-registered adults)
  if (participantRows.length === 0 && birthYear) {
    const rows = await db
      .select()
      .from(participants)
      .where(
        and(
          like(participants.name, nameQuery),
          eq(participants.birthYear, birthYear)
        )
      );
    participantRows = rows.map(r => ({
      id: r.id,
      name: r.name,
      birthYear: r.birthYear,
      guardianId: r.guardianId,
      masterCheckinToken: r.masterCheckinToken,
    }));
  }

  // Strategy 3: Name only (fuzzy, last resort)
  if (participantRows.length === 0) {
    const rows = await db
      .select()
      .from(participants)
      .where(like(participants.name, nameQuery))
      .limit(5);
    participantRows = rows.map(r => ({
      id: r.id,
      name: r.name,
      birthYear: r.birthYear,
      guardianId: r.guardianId,
      masterCheckinToken: r.masterCheckinToken,
    })); // safety limit
  }

  if (participantRows.length === 0) {
    return [];
  }

  const results: RetrievedRegistration[] = [];

  for (const participant of participantRows) {
    // Get all registrations for this participant
    const participantRegistrationsRaw = await db
      .select()
      .from(registrations)
      .innerJoin(events, eq(registrations.eventId, events.id))
      .where(eq(registrations.participantId, participant.id));

    const participantRegistrations = participantRegistrationsRaw.map(row => ({
      eventName: row.events.name,
      checkinToken: row.registrations.checkinToken,
    }));

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
