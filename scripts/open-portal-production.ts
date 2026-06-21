#!/usr/bin/env tsx
/**
 * Open the parent portal for production
 *
 * Usage:
 *   DATABASE_URL="libsql://your-db.turso.io" DATABASE_AUTH_TOKEN="your-token" npx tsx scripts/open-portal-production.ts
 */

import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { settings } from '../lib/db/schema';
import { eq } from 'drizzle-orm';

async function openPortal() {
  const dbUrl = process.env.DATABASE_URL;
  const authToken = process.env.DATABASE_AUTH_TOKEN;

  if (!dbUrl || !authToken) {
    console.error('❌ Error: DATABASE_URL and DATABASE_AUTH_TOKEN must be set');
    console.error('');
    console.error('Usage:');
    console.error('  DATABASE_URL="libsql://your-db.turso.io" DATABASE_AUTH_TOKEN="your-token" npx tsx scripts/open-portal-production.ts');
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
    console.log('\n📂 Checking current settings...');
    const setting = await db.select().from(settings).limit(1).get();

    if (!setting) {
      console.log('   No settings found. Creating default settings with portal open...');
      await db.insert(settings).values({
        eventTitle: 'SAC Fun Day 2026',
        eventDate: '2026-07-05',
        churchName: "St. Augustine's Chapel",
        portalOpen: true,
      });
      console.log('   ✓ Settings created');
    } else {
      console.log(`   Current status: ${setting.portalOpen ? 'OPEN' : 'CLOSED'}`);

      if (setting.portalOpen) {
        console.log('\n✅ Portal is already open!');
      } else {
        console.log('\n   Updating portal status to open...');
        await db.update(settings)
          .set({ portalOpen: true })
          .where(eq(settings.id, setting.id));
        console.log('   ✓ Portal status updated');
      }
    }

    console.log('\n✅ Portal is now OPEN!');
    console.log('   Visit: https://sac-fun-day.vercel.app/portal');
    console.log('   Signup: https://sac-fun-day.vercel.app/portal/signup');

  } catch (error: any) {
    console.error('\n❌ Failed to open portal:', error.message);
    throw error;
  } finally {
    client.close();
  }
}

openPortal().catch((error) => {
  console.error(error);
  process.exit(1);
});
