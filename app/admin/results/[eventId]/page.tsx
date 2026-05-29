import { db } from '@/lib/db/client';
import { events, registrations, participants, results, ageGroups, settings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import ResultEntryForm from './ResultEntryForm';

interface Props {
  params: Promise<{ eventId: string }>;
}

export default async function ResultEntryPage({ params }: Props) {
  const { eventId: eventIdParam } = await params;
  const eventId = parseInt(eventIdParam);

  if (isNaN(eventId)) notFound();

  // Get event details
  const event = await db
    .select({
      id: events.id,
      name: events.name,
      type: events.type,
      unit: events.unit,
      ageGroup: ageGroups.name,
      isComplete: events.isComplete,
    })
    .from(events)
    .leftJoin(ageGroups, eq(events.ageGroupId, ageGroups.id))
    .where(eq(events.id, eventId))
    .get();

  if (!event) notFound();

  // Get all registrations for this event with participant info
  const registeredParticipants = await db
    .select({
      registrationId: registrations.id,
      participantId: participants.id,
      name: participants.name,
      bibNumber: participants.bibNumber,
    })
    .from(registrations)
    .innerJoin(participants, eq(registrations.participantId, participants.id))
    .where(eq(registrations.eventId, eventId))
    .orderBy(participants.name);

  // Get existing results
  const existingResults = await db
    .select({
      registrationId: results.registrationId,
      performanceValue: results.performanceValue,
      place: results.place,
      status: results.status,
      source: results.source,
      enteredAt: results.enteredAt,
      enteredBy: results.enteredBy,
    })
    .from(results)
    .innerJoin(registrations, eq(results.registrationId, registrations.id))
    .where(eq(registrations.eventId, eventId));

  const resultsMap = new Map(
    existingResults.map(r => [r.registrationId, r])
  );

  // Get current operator from settings (stored as "OPERATOR: Name" in notes)
  const currentSettings = await db.select().from(settings).limit(1).get();
  let defaultOperator = '';
  if (currentSettings?.notes) {
    const match = currentSettings.notes.match(/OPERATOR:\s*(.+)/);
    if (match) defaultOperator = match[1].trim();
  }

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
        {defaultOperator && (
          <p className="text-sm text-emerald-700 mt-1">
            Current operator: <strong>{defaultOperator}</strong>
          </p>
        )}
      </div>

      <ResultEntryForm
        eventId={event.id}
        unit={event.unit}
        participants={registeredParticipants}
        existingResults={resultsMap}
        isComplete={event.isComplete}
        totalRegistered={registeredParticipants.length}
        defaultOperator={defaultOperator}
      />

      <div className="mt-8 text-xs text-zinc-400">
        Tip: Use the big buttons for quick place entry. You can also type a performance value (time or distance).
      </div>
    </div>
  );
}
