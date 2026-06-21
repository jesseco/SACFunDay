#!/usr/bin/env tsx
import { db } from '../lib/db/client';
import { ageGroups, events } from '../lib/db/schema';

async function checkData() {
  console.log('\n=== AGE GROUPS ===');
  const groups = await db.select().from(ageGroups).orderBy(ageGroups.sortOrder);
  console.log(`Total: ${groups.length}`);
  groups.forEach(g => {
    console.log(`  ${g.id}. ${g.name} (sort: ${g.sortOrder})`);
  });

  console.log('\n=== EVENTS ===');
  const allEvents = await db.select().from(events).orderBy(events.ageGroupId, events.id);
  console.log(`Total: ${allEvents.length}`);

  // Group by age group
  const byAgeGroup: Record<number, any[]> = {};
  allEvents.forEach(e => {
    if (!byAgeGroup[e.ageGroupId]) byAgeGroup[e.ageGroupId] = [];
    byAgeGroup[e.ageGroupId].push(e);
  });

  groups.forEach(g => {
    console.log(`\n  Age Group: ${g.name} (ID: ${g.id})`);
    const groupEvents = byAgeGroup[g.id] || [];
    if (groupEvents.length === 0) {
      console.log('    (no events)');
    } else {
      groupEvents.forEach(e => {
        console.log(`    - ${e.name} (Type: ${e.type})`);
      });
    }
  });
}

checkData().catch(console.error);
