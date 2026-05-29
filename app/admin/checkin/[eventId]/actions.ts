'use server';

import { db } from '@/lib/db/client';
import { participants, registrations, events } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function checkInWithMasterToken(eventId: number, masterToken: string) {
  // Find participant by master token
  const participant = await db
    .select({
      id: participants.id,
      name: participants.name,
    })
    .from(participants)
    .where(eq(participants.masterCheckinToken, masterToken))
    .get();

  if (!participant) {
    return { success: false, message: 'Participant not found for this QR code.' };
  }

  // Get all registrations for this participant
  const allRegistrations = await db
    .select({
      registrationId: registrations.id,
      eventId: registrations.eventId,
      eventName: events.name,
      checkedInAt: registrations.checkedInAt,
    })
    .from(registrations)
    .innerJoin(events, eq(registrations.eventId, events.id))
    .where(eq(registrations.participantId, participant.id));

  const eventNames = allRegistrations.map(r => r.eventName);

  // Find the specific registration for this event
  const thisEventReg = allRegistrations.find(r => r.eventId === eventId);

  if (!thisEventReg) {
    return {
      success: false,
      message: `${participant.name} is not registered for this event.`,
      participantName: participant.name,
      allEvents: eventNames,
    };
  }

  if (thisEventReg.checkedInAt) {
    return {
      success: false,
      message: `${participant.name} is already checked in for this event.`,
      participantName: participant.name,
      allEvents: eventNames,
    };
  }

  // Perform check-in for this specific event
  await db
    .update(registrations)
    .set({ checkedInAt: new Date() })
    .where(eq(registrations.id, thisEventReg.registrationId));

  return {
    success: true,
    participantName: participant.name,
    allEvents: eventNames,
    message: `Checked in successfully for this event.`,
  };
}
