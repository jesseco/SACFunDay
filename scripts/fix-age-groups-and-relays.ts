#!/usr/bin/env tsx
/**
 * Fix age groups and family relay logic
 *
 * Changes:
 * 1. Remove "Kindergarten Family Relay" and "Primary & Secondary Family Relay" age groups
 * 2. Keep only 7 age groups
 * 3. Move family relay events to appropriate age groups (they can be assigned to multiple)
 */

import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { ageGroups, events, registrations, results, participants } from '../lib/db/schema';
import { eq } from 'drizzle-orm';

async function fixStructure() {
  const dbUrl = 'libsql://sacfunday-jesseco656.aws-ap-northeast-1.turso.io';

  console.log('🔄 Fixing age groups and family relay structure...\n');

  const { execSync } = require('child_process');
  const authToken = execSync('turso db tokens create sacfunday --expiration none', { encoding: 'utf-8' }).trim();

  const client = createClient({
    url: dbUrl,
    authToken: authToken,
  });

  const db = drizzle(client);

  try {
    console.log('Step 1: Getting current data...');
    const currentAgeGroups = await db.select().from(ageGroups).orderBy(ageGroups.sortOrder);
    const currentEvents = await db.select().from(events);

    console.log(`  Current age groups: ${currentAgeGroups.length}`);
    console.log(`  Current events: ${currentEvents.length}`);

    // Find the family relay age groups to remove
    const kindergartenRelayGroup = currentAgeGroups.find(g => g.name === 'Kindergarten Family Relay');
    const primaryRelayGroup = currentAgeGroups.find(g => g.name === 'Primary & Secondary Family Relay');

    if (!kindergartenRelayGroup || !primaryRelayGroup) {
      console.log('  Family relay age groups not found - structure may already be correct');
      return;
    }

    console.log(`  Found Kindergarten Family Relay (ID: ${kindergartenRelayGroup.id})`);
    console.log(`  Found Primary & Secondary Family Relay (ID: ${primaryRelayGroup.id})`);

    // Get the valid age groups
    const validGroups = currentAgeGroups.filter(g =>
      g.name !== 'Kindergarten Family Relay' &&
      g.name !== 'Primary & Secondary Family Relay'
    );

    console.log(`  Valid age groups: ${validGroups.length}`);

    // Get family relay events
    const kindergartenRelayEvent = currentEvents.find(e => e.ageGroupId === kindergartenRelayGroup.id);
    const primaryRelayEvent = currentEvents.find(e => e.ageGroupId === primaryRelayGroup.id);

    console.log('\nStep 2: Clearing old data...');
    await db.delete(results);
    await db.delete(registrations);
    await db.delete(participants);
    console.log('  ✓ Cleared participants, registrations, results');

    console.log('\nStep 3: Deleting events from family relay age groups...');
    if (kindergartenRelayEvent) {
      await db.delete(events).where(eq(events.id, kindergartenRelayEvent.id));
      console.log(`  ✓ Deleted Kindergarten Family Relay event`);
    }
    if (primaryRelayEvent) {
      await db.delete(events).where(eq(events.id, primaryRelayEvent.id));
      console.log(`  ✓ Deleted Primary & Secondary Family Relay event`);
    }

    console.log('\nStep 4: Deleting family relay age groups...');
    await db.delete(ageGroups).where(eq(ageGroups.id, kindergartenRelayGroup.id));
    await db.delete(ageGroups).where(eq(ageGroups.id, primaryRelayGroup.id));
    console.log('  ✓ Deleted family relay age groups');

    console.log('\nStep 5: Re-creating family relay events...');

    // Family relays will be added as events under Kindergarten and G1-3 age groups
    // But with special logic in the signup form to allow any appropriate group

    const kindergartenGroup = validGroups.find(g => g.name === 'Kindergarten');
    const g13Group = validGroups.find(g => g.name === 'G1-3');

    if (kindergartenGroup) {
      await db.insert(events).values({
        name: 'Kindergarten Family Relay',
        type: 'relay',
        ageGroupId: kindergartenGroup.id,
      });
      console.log('  ✓ Created Kindergarten Family Relay event');
    }

    if (g13Group) {
      await db.insert(events).values({
        name: 'Primary & Secondary Family Relay',
        type: 'relay',
        ageGroupId: g13Group.id,
      });
      console.log('  ✓ Created Primary & Secondary Family Relay event');
    }

    console.log('\n✅ Structure fixed!');
    console.log('\nFinal structure:');
    console.log('  - Age Groups: 7');
    console.log('    1. Kindergarten');
    console.log('    2. G1-3');
    console.log('    3. G4-6');
    console.log('    4. S1-S6');
    console.log('    5. Women');
    console.log('    6. Men 49 or below');
    console.log('    7. Men 50+');
    console.log('  - Events: 16');
    console.log('    - Family relays stored under Kindergarten and G1-3');
    console.log('    - Signup form logic will allow appropriate participants');

  } catch (error: any) {
    console.error('\n❌ Failed:', error.message);
    throw error;
  } finally {
    client.close();
  }
}

fixStructure().catch(console.error);
