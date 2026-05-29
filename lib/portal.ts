import { db } from './db/client';
import { settings } from './db/schema';
import { eq } from 'drizzle-orm';

export async function getPortalStatus() {
  const setting = await db.select().from(settings).limit(1).get();

  if (!setting) {
    return {
      isOpen: false,
      eventTitle: 'SAC Fun Day',
      eventDate: null,
      message: 'Portal settings not configured yet.',
    };
  }

  const now = new Date();
  let isOpen = setting.portalOpen;

  // If date windows are set, respect them
  if (setting.portalOpensAt && setting.portalClosesAt) {
    const opensAt = new Date(setting.portalOpensAt);
    const closesAt = new Date(setting.portalClosesAt);
    isOpen = setting.portalOpen && now >= opensAt && now <= closesAt;
  } else if (setting.portalOpensAt) {
    const opensAt = new Date(setting.portalOpensAt);
    isOpen = setting.portalOpen && now >= opensAt;
  } else if (setting.portalClosesAt) {
    const closesAt = new Date(setting.portalClosesAt);
    isOpen = setting.portalOpen && now <= closesAt;
  }

  return {
    isOpen,
    eventTitle: setting.eventTitle,
    eventDate: setting.eventDate,
    churchName: setting.churchName,
    message: isOpen 
      ? 'Sign-ups are currently open!' 
      : 'Sign-ups are currently closed.',
  };
}
