import { db } from '@/lib/db/client';
import { participants, guardians, ageGroups } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import ParticipantsClient from './ParticipantsClient';

export default async function ParticipantsPage() {
  const [kidsRaw, ageGroupList] = await Promise.all([
    db
      .select()
      .from(participants)
      .leftJoin(guardians, eq(participants.guardianId, guardians.id))
      .leftJoin(ageGroups, eq(participants.ageGroupId, ageGroups.id))
      .orderBy(participants.name),

    db.select().from(ageGroups).orderBy(ageGroups.sortOrder),
  ]);

  const kids = kidsRaw.map((row) => ({
    id: row.participants.id,
    name: row.participants.name,
    bib: row.participants.bibNumber,
    ageGroup: row.age_groups?.name ?? null,
    ageGroupId: row.participants.ageGroupId,
    guardian: row.guardians?.name ?? 'Self-registered',
    guardianPhone: row.guardians?.phone ?? '',
    guardianEmail: row.guardians?.email ?? null,
    notes: row.participants.notes,
  }));

  return <ParticipantsClient participants={kids} ageGroups={ageGroupList} />;
}
