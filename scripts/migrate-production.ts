#!/usr/bin/env tsx
/**
 * Migration script to add lunch_attendees and payment_proof columns to production
 *
 * Usage:
 *   DATABASE_URL="libsql://your-db.turso.io" DATABASE_AUTH_TOKEN="your-token" npx tsx scripts/migrate-production.ts
 */

import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';

async function migrate() {
  const dbUrl = process.env.DATABASE_URL;
  const authToken = process.env.DATABASE_AUTH_TOKEN;

  if (!dbUrl || !authToken) {
    console.error('❌ Error: DATABASE_URL and DATABASE_AUTH_TOKEN must be set');
    console.error('');
    console.error('Usage:');
    console.error('  DATABASE_URL="libsql://your-db.turso.io" DATABASE_AUTH_TOKEN="your-token" npx tsx scripts/migrate-production.ts');
    process.exit(1);
  }

  console.log('🔗 Connecting to production database...');
  console.log(`   URL: ${dbUrl}`);

  const client = createClient({
    url: dbUrl,
    authToken: authToken,
  });

  const db = drizzle(client);

  try {
    console.log('\n📋 Starting migration...');

    // Check if columns already exist
    console.log('   Checking existing schema...');
    const tableInfo = await client.execute('PRAGMA table_info(guardians)');
    const columnNames = tableInfo.rows.map((row: any) => row.name);

    const hasLunchAttendees = columnNames.includes('lunch_attendees');
    const hasPaymentProof = columnNames.includes('payment_proof');

    if (hasLunchAttendees && hasPaymentProof) {
      console.log('✅ Columns already exist, migration not needed');
      return;
    }

    // Add lunch_attendees column with default value
    if (!hasLunchAttendees) {
      console.log('   Adding lunch_attendees column...');
      await client.execute('ALTER TABLE guardians ADD COLUMN lunch_attendees INTEGER NOT NULL DEFAULT 0');
      console.log('   ✓ lunch_attendees column added');
    } else {
      console.log('   ✓ lunch_attendees column already exists');
    }

    // Add payment_proof column (nullable)
    if (!hasPaymentProof) {
      console.log('   Adding payment_proof column...');
      await client.execute('ALTER TABLE guardians ADD COLUMN payment_proof TEXT');
      console.log('   ✓ payment_proof column added');
    } else {
      console.log('   ✓ payment_proof column already exists');
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('\n📊 Updated schema:');
    const updatedInfo = await client.execute('PRAGMA table_info(guardians)');
    updatedInfo.rows.forEach((row: any) => {
      if (row.name === 'lunch_attendees' || row.name === 'payment_proof') {
        console.log(`   - ${row.name}: ${row.type}${row.notnull ? ' NOT NULL' : ''}${row.dflt_value ? ` DEFAULT ${row.dflt_value}` : ''}`);
      }
    });

  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.close();
  }
}

migrate().catch((error) => {
  console.error(error);
  process.exit(1);
});
