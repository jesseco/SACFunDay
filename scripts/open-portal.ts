#!/usr/bin/env tsx
import { db } from '../lib/db/client';
import { settings } from '../lib/db/schema';
import { eq } from 'drizzle-orm';

async function openPortal() {
  console.log('Opening parent portal...');

  const setting = await db.select().from(settings).limit(1).get();

  if (!setting) {
    console.log('No settings found. Creating default settings with portal open...');
    await db.insert(settings).values({
      eventTitle: 'SAC Fun Day 2026',
      eventDate: '2026-07-05',
      churchName: "St. Augustine's Chapel",
      portalOpen: true,
    });
  } else {
    console.log('Updating portal status to open...');
    await db.update(settings)
      .set({ portalOpen: true })
      .where(eq(settings.id, setting.id));
  }

  console.log('✅ Portal is now open!');
  console.log('   Visit: https://sac-fun-day.vercel.app/portal');
}

openPortal().catch(console.error);
