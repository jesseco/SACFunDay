/**
 * Migration script to add lunch_attendees and payment_proof columns
 * Run with: npx tsx scripts/migrate-payment-fields.ts
 */

import { db } from '../lib/db/client';
import { sql } from 'drizzle-orm';

async function migrate() {
  console.log('Starting migration...');

  try {
    // Add lunch_attendees column with default value
    console.log('Adding lunch_attendees column...');
    await db.run(sql`ALTER TABLE guardians ADD COLUMN lunch_attendees INTEGER NOT NULL DEFAULT 0`);

    // Add payment_proof column (nullable)
    console.log('Adding payment_proof column...');
    await db.run(sql`ALTER TABLE guardians ADD COLUMN payment_proof TEXT`);

    console.log('✓ Migration completed successfully!');
  } catch (error: any) {
    if (error.message?.includes('duplicate column name')) {
      console.log('✓ Columns already exist, skipping migration');
    } else {
      console.error('✗ Migration failed:', error);
      throw error;
    }
  }
}

migrate().catch(console.error);
