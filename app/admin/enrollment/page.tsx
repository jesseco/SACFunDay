import { db } from '@/lib/db/client';
import { guardians, participants } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import EnrollmentClient from './EnrollmentClient';

export default async function EnrollmentPage() {
  // Get all guardians
  const allGuardians = await db.select().from(guardians).orderBy(guardians.name);

  // Get all participants to count per guardian
  const allParticipants = await db.select().from(participants);

  // Build enrollment data
  const enrollments = allGuardians.map((guardian) => {
    const participantCount = allParticipants.filter(
      (p) => p.guardianId === guardian.id
    ).length;

    return {
      guardianId: guardian.id,
      guardianName: guardian.name,
      guardianPhone: guardian.phone,
      guardianEmail: guardian.email ?? null,
      lunchAttendees: guardian.lunchAttendees ?? 0,
      paymentProof: guardian.paymentProof ?? null,
      participantCount,
    };
  });

  return <EnrollmentClient enrollments={enrollments} />;
}
