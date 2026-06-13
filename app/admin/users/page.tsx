import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { requireUser } from '@/lib/auth';
import UsersClient from './UsersClient';

export default async function UsersPage() {
  const currentUser = await requireUser('admin');

  const all = await db.select().from(users).orderBy(users.username);

  const list = all.map((u) => ({
    id: u.id,
    username: u.username,
    name: u.name,
    role: u.role as 'admin' | 'marshal',
    isActive: u.isActive,
    createdAt: u.createdAt,
  }));

  return <UsersClient users={list} currentUserId={currentUser.userId} />;
}
