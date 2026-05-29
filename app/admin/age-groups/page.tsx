import { db } from '@/lib/db/client';
import { ageGroups } from '@/lib/db/schema';
import AgeGroupsClient from './AgeGroupsClient';

export default async function AgeGroupsPage() {
  const groups = await db
    .select({
      id: ageGroups.id,
      name: ageGroups.name,
      sortOrder: ageGroups.sortOrder,
    })
    .from(ageGroups)
    .orderBy(ageGroups.sortOrder);

  return <AgeGroupsClient groups={groups} />;
}
