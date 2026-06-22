#!/usr/bin/env tsx
/**
 * Update production database to 2025 structure
 * Run this against the Turso production database
 */

import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { ageGroups, events, registrations, results, participants } from '../lib/db/schema';

async function updateProduction() {
  // Get Turso connection details
  const dbUrl = 'libsql://sacfunday-jesseco656.aws-ap-northeast-1.turso.io';

  console.log('🔄 Updating production database to 2025 structure...\n');
  console.log('⚠️  This will DELETE all existing participants, registrations, and results!');
  console.log('   Waiting 3 seconds...\n');
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Need to get auth token from turso CLI
  const { execSync } = require('child_process');
  const authToken = execSync('turso db tokens create sacfunday --expiration none', { encoding: 'utf-8' }).trim();

  const client = createClient({
    url: dbUrl,
    authToken: authToken,
  });

  const db = drizzle(client);

  try {
    console.log('Step 1: Deleting old results...');
    await db.delete(results);
    console.log('  ✓ Cleared');

    console.log('\nStep 2: Deleting old registrations...');
    await db.delete(registrations);
    console.log('  ✓ Cleared');

    console.log('\nStep 3: Deleting old participants...');
    await db.delete(participants);
    console.log('  ✓ Cleared');

    console.log('\nStep 4: Deleting old events...');
    await db.delete(events);
    console.log('  ✓ Cleared');

    console.log('\nStep 5: Deleting old age groups...');
    await db.delete(ageGroups);
    console.log('  ✓ Cleared');

    console.log('\nStep 6: Creating new age groups...');
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

    console.log('\nStep 7: Creating events...');
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

    console.log('\n✅ Production migration complete!');
    console.log('\nSummary:');
    console.log(`  - Age Groups: ${newGroups.length}`);
    console.log(`  - Events: ${eventsToCreate.length}`);
    console.log('\nProduction is now ready for 2026!');

  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.close();
  }
}

updateProduction().catch(console.error);
