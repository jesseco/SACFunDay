import { db } from '@/lib/db/client';
import { events, registrations, participants, results, ageGroups } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import ResultEntryForm from './ResultEntryForm';

interface Props {
  params: Promise<{ eventId: string }>;
}

export default async function ResultEntryPage({ params }: Props) {
  const user = await requireUser();
  const { eventId: eventIdParam } = await params;
  const eventId = parseInt(eventIdParam);

  if (isNaN(eventId)) notFound();

  // Get event details
  const eventRaw = await db
    .select()
    .from(events)
    .leftJoin(ageGroups, eq(events.ageGroupId, ageGroups.id))
    .where(eq(events.id, eventId))
    .get();

  const event = eventRaw
    ? {
        id: eventRaw.events.id,
        name: eventRaw.events.name,
        type: eventRaw.events.type,
        unit: eventRaw.events.unit,
        ageGroup: eventRaw.age_groups?.name ?? null,
        isComplete: eventRaw.events.isComplete,
      }
    : null;

  if (!event) notFound();

  // Get all registrations for this event with participant info
  const registeredParticipantsRaw = await db
    .select()
    .from(registrations)
    .innerJoin(participants, eq(registrations.participantId, participants.id))
    .where(eq(registrations.eventId, eventId))
    .orderBy(participants.name);

  const registeredParticipants = registeredParticipantsRaw.map((row) => ({
    registrationId: row.registrations.id,
    participantId: row.participants.id,
    name: row.participants.name,
    bibNumber: row.participants.bibNumber,
  }));

  // Get existing results
  const existingResultsRaw = await db
    .select()
    .from(results)
    .innerJoin(registrations, eq(results.registrationId, registrations.id))
    .where(eq(registrations.eventId, eventId));

  const existingResults = existingResultsRaw.map((row) => ({
    registrationId: row.results.registrationId,
    performanceValue: row.results.performanceValue,
    place: row.results.place,
    status: row.results.status,
    source: row.results.source,
    enteredAt: row.results.enteredAt,
    enteredBy: row.results.enteredBy,
  }));

  const resultsMap = new Map(
    existingResults.map(r => [r.registrationId, r])
  );

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <div className="flex items-center gap-3 text-sm text-zinc-500 mb-1">
          <span>Result Entry</span>
          <span>•</span>
          <span>{event.ageGroup}</span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">{event.name}</h1>
        <p className="text-zinc-600">
          {event.type} • {event.unit ? event.unit : 'Place only'}
          {event.isComplete && (
            <span className="ml-2 text-xs px-2 py-0.5 rounded bg-zinc-200">Event Completed</span>
          )}
        </p>
        <p className="text-sm text-emerald-700 mt-1">
          Entering as <strong>{user.name}</strong>
        </p>
      </div>

      <ResultEntryForm
        eventId={event.id}
        unit={event.unit}
        participants={registeredParticipants}
        existingResults={resultsMap}
        isComplete={event.isComplete}
        totalRegistered={registeredParticipants.length}
        enteredByName={user.name}
      />

      <div className="mt-8 text-xs text-zinc-400">
        Tip: Use the big buttons for quick place entry. You can also type a performance value (time or distance).
      </div>
    </div>
  );
}
