import { db } from '@/lib/db/client';
import { participants, guardians, ageGroups } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import ParticipantsClient from './ParticipantsClient';

export default async function ParticipantsPage() {
  const [kids, ageGroupList] = await Promise.all([
    db
      .select({
        id: participants.id,
        name: participants.name,
        bib: participants.bibNumber,
        ageGroup: ageGroups.name,
        ageGroupId: participants.ageGroupId,
        guardian: guardians.name,
        guardianPhone: guardians.phone,
        guardianEmail: guardians.email,
        notes: participants.notes,
      })
      .from(participants)
      .leftJoin(guardians, eq(participants.guardianId, guardians.id))
      .leftJoin(ageGroups, eq(participants.ageGroupId, ageGroups.id))
      .orderBy(participants.name),

    db.select({ id: ageGroups.id, name: ageGroups.name }).from(ageGroups).orderBy(ageGroups.sortOrder),
  ]);

  return <ParticipantsClient participants={kids} ageGroups={ageGroupList} />;
}
