import { db } from '@/lib/db/client';
import { events, ageGroups, registrations, results } from '@/lib/db/schema';
import { eq, count } from 'drizzle-orm';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function ResultsList() {
  const eventList = await db
    .select({
      id: events.id,
      name: events.name,
      type: events.type,
      ageGroup: ageGroups.name,
      isComplete: events.isComplete,
      scheduledTime: events.scheduledTime,
    })
    .from(events)
    .leftJoin(ageGroups, eq(events.ageGroupId, ageGroups.id))
    .orderBy(events.scheduledTime);

  // Get registration counts and result counts for each event
  const eventsWithStats = await Promise.all(
    eventList.map(async (event) => {
      const [regCount] = await db
        .select({ count: count() })
        .from(registrations)
        .where(eq(registrations.eventId, event.id));

      const [resultCount] = await db
        .select({ count: count() })
        .from(results)
        .leftJoin(registrations, eq(results.registrationId, registrations.id))
        .where(eq(registrations.eventId, event.id));

      return {
        ...event,
        registeredCount: regCount?.count ?? 0,
        resultsEntered: resultCount?.count ?? 0,
      };
    })
  );

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">Result Entry</h1>
        <p className="text-sm text-zinc-500">Select an event to enter results</p>
      </div>

      <div className="grid gap-4">
        {eventsWithStats.map((event) => {
          const progress =
            event.registeredCount > 0
              ? Math.round((event.resultsEntered / event.registeredCount) * 100)
              : 0;

          return (
            <Card key={event.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-semibold">{event.name}</h3>
                      {event.isComplete && (
                        <span className="text-xs px-2.5 py-1 rounded-full bg-zinc-200 text-zinc-700">
                          Completed
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-zinc-600 mt-1">
                      {event.ageGroup} • {event.scheduledTime || 'Time TBD'}
                    </p>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-sm text-zinc-500">Progress</div>
                      <div className="font-medium">
                        {event.resultsEntered} / {event.registeredCount} entered
                        {event.registeredCount > 0 && (
                          <span className="text-emerald-600 ml-1">({progress}%)</span>
                        )}
                      </div>
                    </div>

                    <Link href={`/admin/results/${event.id}`}>
                      <Button size="lg" variant={event.isComplete ? "outline" : "default"}>
                        {event.resultsEntered > 0 ? 'Continue Entry' : 'Start Entry'}
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {eventsWithStats.length === 0 && (
        <p className="text-zinc-500">No events found. Create some events first.</p>
      )}
    </div>
  );
}
