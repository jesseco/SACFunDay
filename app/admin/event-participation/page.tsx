import { db } from '@/lib/db/client';
import { participants, guardians, ageGroups, registrations, events } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import EventParticipationClient from './EventParticipationClient';

export default async function EventParticipationPage() {
  // Get all participants with their event registrations
  const participantsRaw = await db
    .select()
    .from(participants)
    .leftJoin(guardians, eq(participants.guardianId, guardians.id))
    .leftJoin(ageGroups, eq(participants.ageGroupId, ageGroups.id))
    .orderBy(participants.name);

  // Get all event registrations
  const allRegistrations = await db
    .select()
    .from(registrations)
    .leftJoin(events, eq(registrations.eventId, events.id));

  // Build participant data with events
  const participantData = participantsRaw.map((row) => {
    const participantEvents = allRegistrations
      .filter((reg) => reg.registrations.participantId === row.participants.id)
      .map((reg) => ({
        id: reg.events!.id,
        name: reg.events!.name,
      }));

    return {
      id: row.participants.id,
      name: row.participants.name,
      bibNumber: row.participants.bibNumber,
      ageGroup: row.age_groups?.name ?? null,
      guardianName: row.guardians?.name ?? 'Unknown',
      guardianPhone: row.guardians?.phone ?? '',
      events: participantEvents,
    };
  });

  // Get all events for filtering
  const allEvents = await db.select().from(events).orderBy(events.name);

  return <EventParticipationClient participants={participantData} events={allEvents} />;
}
