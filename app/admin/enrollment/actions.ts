'use server';

import { db } from '@/lib/db/client';
import { guardians, participants, registrations } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function deleteGuardian(guardianId: number) {
  try {
    // Get all participants for this guardian
    const guardiansParticipants = await db
      .select()
      .from(participants)
      .where(eq(participants.guardianId, guardianId));

    // Delete all registrations for these participants
    for (const participant of guardiansParticipants) {
      await db.delete(registrations).where(eq(registrations.participantId, participant.id));
    }

    // Delete all participants for this guardian
    await db.delete(participants).where(eq(participants.guardianId, guardianId));

    // Delete the guardian
    await db.delete(guardians).where(eq(guardians.id, guardianId));

    revalidatePath('/admin/enrollment');
    revalidatePath('/admin/participants');
    revalidatePath('/admin/event-participation');

    return { success: true };
  } catch (error) {
    console.error('Error deleting guardian:', error);
    return { success: false, error: 'Failed to delete enrollment' };
  }
}
