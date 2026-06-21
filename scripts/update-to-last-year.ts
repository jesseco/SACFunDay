#!/usr/bin/env tsx
/**
 * Update age groups and events to match 2025 Fun Day structure
 */

import { db } from '../lib/db/client';
import { ageGroups, events, registrations, results, participants } from '../lib/db/schema';
import { eq } from 'drizzle-orm';

async function updateToLastYear() {
  console.log('🔄 Updating to last year\'s age groups and events...\n');

  // Check if there are any registrations or results
  const existingRegistrations = await db.select().from(registrations).limit(1);
  const existingResults = await db.select().from(results).limit(1);

  if (existingRegistrations.length > 0 || existingResults.length > 0) {
    console.error('⚠️  WARNING: There are existing registrations or results in the database!');
    console.error('   This script will delete all events and age groups.');
    console.error('   Please backup your database first or cancel now (Ctrl+C)');
    console.error('');
    console.error('   Waiting 5 seconds...');
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  console.log('Step 1: Deleting old registrations and results...');
  await db.delete(results);
  await db.delete(registrations);
  console.log('  ✓ Cleared');

  console.log('\nStep 2: Deleting old participants...');
  await db.delete(participants);
  console.log('  ✓ Cleared');

  console.log('\nStep 3: Deleting old events...');
  await db.delete(events);
  console.log('  ✓ Cleared');

  console.log('\nStep 4: Deleting old age groups...');
  await db.delete(ageGroups);
  console.log('  ✓ Cleared');

  console.log('\nStep 5: Creating new age groups...');
  const newGroups = [
    { name: 'Kindergarten', sortOrder: 1 },
    { name: 'G1-3', sortOrder: 2 },
    { name: 'G4-6', sortOrder: 3 },
    { name: 'S1-S6', sortOrder: 4 },
    { name: 'Women', sortOrder: 5 },
    { name: 'Men 49 or below', sortOrder: 6 },
    { name: 'Men 50+', sortOrder: 7 },
    { name: 'Kindergarten Family Relay', sortOrder: 8 },
    { name: 'Primary & Secondary Family Relay', sortOrder: 9 },
  ];

  const createdGroups: Record<string, number> = {};
  for (const group of newGroups) {
    const [inserted] = await db.insert(ageGroups).values(group).returning();
    createdGroups[group.name] = inserted.id;
    console.log(`  ✓ ${group.name} (ID: ${inserted.id})`);
  }

  console.log('\nStep 6: Creating events...');

  const eventsToCreate = [
    // Kindergarten
    { ageGroup: 'Kindergarten', name: 'Spoon and Egg Race', type: 'novelty' },
    { ageGroup: 'Kindergarten', name: '40m Race', type: 'track', unit: 'seconds' },
    { ageGroup: 'Kindergarten', name: 'Standing Long Jump', type: 'field', unit: 'meters' },
    { ageGroup: 'Kindergarten', name: 'Bean Bag Throw', type: 'field', unit: 'meters' },

    // G1-3
    { ageGroup: 'G1-3', name: '60m Race', type: 'track', unit: 'seconds' },
    { ageGroup: 'G1-3', name: 'Standing Long Jump', type: 'field', unit: 'meters' },
    { ageGroup: 'G1-3', name: 'Bean Bag Throw', type: 'field', unit: 'meters' },

    // G4-6
    { ageGroup: 'G4-6', name: '60m Race', type: 'track', unit: 'seconds' },
    { ageGroup: 'G4-6', name: 'Standing Long Jump', type: 'field', unit: 'meters' },
    { ageGroup: 'G4-6', name: 'Bean Bag Throw', type: 'field', unit: 'meters' },

    // S1-S6
    { ageGroup: 'S1-S6', name: '100m Race', type: 'track', unit: 'seconds' },

    // Women
    { ageGroup: 'Women', name: '100m Race', type: 'track', unit: 'seconds' },

    // Men 49 or below
    { ageGroup: 'Men 49 or below', name: '100m Race', type: 'track', unit: 'seconds' },

    // Men 50+
    { ageGroup: 'Men 50+', name: '100m Race', type: 'track', unit: 'seconds' },

    // Family Relays
    { ageGroup: 'Kindergarten Family Relay', name: 'Kindergarten Family Relay', type: 'relay' },
    { ageGroup: 'Primary & Secondary Family Relay', name: 'Primary & Secondary Family Relay', type: 'relay' },
  ];

  for (const event of eventsToCreate) {
    const ageGroupId = createdGroups[event.ageGroup];
    await db.insert(events).values({
      name: event.name,
      type: event.type as 'track' | 'field' | 'relay' | 'novelty',
      unit: event.unit || null,
      ageGroupId: ageGroupId,
    });
    console.log(`  ✓ ${event.ageGroup}: ${event.name}`);
  }

  console.log('\n✅ Migration complete!');
  console.log('\nSummary:');
  console.log(`  - Age Groups: ${newGroups.length}`);
  console.log(`  - Events: ${eventsToCreate.length}`);
  console.log('\nYou can now:');
  console.log('  1. Login to admin area');
  console.log('  2. Review age groups and events');
  console.log('  3. Open the portal for parent signups');
}

updateToLastYear().catch(console.error);
