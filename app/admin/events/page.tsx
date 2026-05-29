import { db } from '@/lib/db/client';
import { events, ageGroups } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import EventsClient from './EventsClient';

export default async function EventsPage() {
  const [eventList, ageGroupList] = await Promise.all([
    db
      .select({
        id: events.id,
        name: events.name,
        type: events.type,
        ageGroup: ageGroups.name,
        ageGroupId: events.ageGroupId,
        scheduledTime: events.scheduledTime,
        location: events.location,
        isComplete: events.isComplete,
      })
      .from(events)
      .leftJoin(ageGroups, eq(events.ageGroupId, ageGroups.id))
      .orderBy(events.scheduledTime),

    db.select({ id: ageGroups.id, name: ageGroups.name }).from(ageGroups).orderBy(ageGroups.sortOrder),
  ]);

  return <EventsClient events={eventList} ageGroups={ageGroupList} />;
}
