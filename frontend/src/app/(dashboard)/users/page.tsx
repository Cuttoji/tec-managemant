import type { Metadata } from 'next';
import { listUsers }  from '@/features/users/queries';
import { UsersClient } from './users-client';

export const metadata: Metadata = { title: 'Users' };

export default async function UsersPage() {
  const users = await listUsers(true);
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <p className="text-sm text-gray-500 mt-0.5">ผู้ใช้งานในระบบ ({users.length} คน)</p>
      </div>
      <UsersClient users={users as any} />
    </div>
  );
}
