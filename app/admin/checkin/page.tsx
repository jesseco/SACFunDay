import { db } from '@/lib/db/client';
import { events, ageGroups } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function CheckInIndex() {
  const eventListRaw = await db
    .select()
    .from(events)
    .leftJoin(ageGroups, eq(events.ageGroupId, ageGroups.id))
    .orderBy(events.scheduledTime);

  const eventList = eventListRaw.map((row) => ({
    id: row.events.id,
    name: row.events.name,
    ageGroup: row.age_groups?.name ?? null,
    scheduledTime: row.events.scheduledTime,
    isComplete: row.events.isComplete,
  }));

  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-semibold tracking-tight mb-6">Station Check-in</h1>
      <p className="text-zinc-600 mb-8">
        Select the event/station you are responsible for to begin checking in participants using their Master QR.
      </p>

      <div className="grid gap-4">
        {eventList.map((event) => (
          <Card key={event.id}>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <div className="font-semibold text-lg">{event.name}</div>
                <div className="text-sm text-zinc-600">
                  {event.ageGroup} • {event.scheduledTime || 'Time TBD'}
                </div>
              </div>
              <Link href={`/admin/checkin/${event.id}`}>
                <Button disabled={event.isComplete}>
                  {event.isComplete ? 'Event Completed' : 'Open Check-in'}
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
