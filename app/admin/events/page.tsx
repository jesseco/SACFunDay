import { db } from '@/lib/db/client';
import { events, ageGroups } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import EventsClient from './EventsClient';

export default async function EventsPage() {
  const [eventListRaw, ageGroupList] = await Promise.all([
    db
      .select()
      .from(events)
      .leftJoin(ageGroups, eq(events.ageGroupId, ageGroups.id))
      .orderBy(events.scheduledTime),

    db.select().from(ageGroups).orderBy(ageGroups.sortOrder),
  ]);

  const eventList = eventListRaw.map((row) => ({
    id: row.events.id,
    name: row.events.name,
    type: row.events.type,
    ageGroup: row.age_groups?.name ?? null,
    ageGroupId: row.events.ageGroupId,
    scheduledTime: row.events.scheduledTime,
    location: row.events.location,
    isComplete: row.events.isComplete,
  }));

  return <EventsClient events={eventList} ageGroups={ageGroupList} />;
}
