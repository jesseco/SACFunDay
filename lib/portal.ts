import { db } from './db/client';
import { settings } from './db/schema';

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

  return {
    isOpen: setting.portalOpen,
    eventTitle: setting.eventTitle,
    eventDate: setting.eventDate,
    churchName: setting.churchName,
    message: setting.portalOpen
      ? 'Sign-ups are currently open!'
      : 'Sign-ups are currently closed.',
  };
}
