import { db } from '../lib/db/client';
import { guardians, participants, registrations } from '../lib/db/schema';

async function wipeEnrollments() {
  console.log('🗑️  Starting data wipe...\n');

  // Count current data
  const currentGuardians = await db.select().from(guardians);
  const currentParticipants = await db.select().from(participants);
  const currentRegistrations = await db.select().from(registrations);

  console.log('📊 Current data:');
  console.log(`   - Guardians: ${currentGuardians.length}`);
  console.log(`   - Participants: ${currentParticipants.length}`);
  console.log(`   - Registrations: ${currentRegistrations.length}`);
  console.log('');

  if (currentGuardians.length === 0 && currentParticipants.length === 0 && currentRegistrations.length === 0) {
    console.log('✅ Database is already clean. Nothing to wipe.');
    return;
  }

  // Delete in correct order (respect foreign keys)
  console.log('🧹 Deleting registrations...');
  await db.delete(registrations);

  console.log('🧹 Deleting participants...');
  await db.delete(participants);

  console.log('🧹 Deleting guardians...');
  await db.delete(guardians);

  console.log('');
  console.log('✅ All enrollment data wiped successfully!');
  console.log('');
  console.log('Note: Age groups, events, and admin users are preserved.');
}

wipeEnrollments()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
