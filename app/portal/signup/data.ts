'use server';

import { db } from '@/lib/db/client';
import { ageGroups, events } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function getPortalFormData() {
  const [groups, allEvents] = await Promise.all([
    db.select().from(ageGroups).orderBy(ageGroups.sortOrder),
    db.select().from(events).orderBy(events.scheduledTime),
  ]);

  // Group events by age group
  const eventsByAgeGroup: Record<number, any[]> = {};

  allEvents.forEach((event) => {
    if (!eventsByAgeGroup[event.ageGroupId]) {
      eventsByAgeGroup[event.ageGroupId] = [];
    }
    eventsByAgeGroup[event.ageGroupId].push({
      id: event.id,
      name: event.name,
      type: event.type,
    });
  });

  return {
    ageGroups: groups.map(g => ({ id: g.id, name: g.name })),
    eventsByAgeGroup,
  };
}
