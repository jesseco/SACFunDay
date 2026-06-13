'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  createUser,
  setUserActive,
  setUserRole,
  resetUserPassword,
} from './actions';

type Role = 'admin' | 'marshal';

type User = {
  id: number;
  username: string;
  name: string;
  role: Role;
  isActive: boolean;
  createdAt: Date | null;
};

interface UsersClientProps {
  users: User[];
  currentUserId: number;
}

export default function UsersClient({ users, currentUserId }: UsersClientProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [role, setRole] = useState<Role>('marshal');
  const [error, setError] = useState('');

  const openCreate = () => {
    setError('');
    setRole('marshal');
    setIsOpen(true);
  };

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    setError('');
    formData.set('role', role);
    try {
      const result = await createUser(formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setIsOpen(false);
      window.location.reload();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (user: User) => {
    const verb = user.isActive ? 'Deactivate' : 'Reactivate';
    if (!confirm(`${verb} ${user.name} (${user.username})?`)) return;
    const result = await setUserActive(user.id, !user.isActive);
    if (result?.error) {
      alert(result.error);
      return;
    }
    window.location.reload();
  };

  const handleRoleChange = async (user: User, newRole: Role) => {
    if (newRole === user.role) return;
    const result = await setUserRole(user.id, newRole);
    if (result?.error) {
      alert(result.error);
      return;
    }
    window.location.reload();
  };

  const handleResetPassword = async (user: User) => {
    const pw = prompt(`New password for ${user.name} (min 8 characters):`);
    if (pw === null) return;
    const result = await resetUserPassword(user.id, pw);
    if (result?.error) {
      alert(result.error);
      return;
    }
    alert(`Password updated for ${user.name}.`);
  };

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">OC Members</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Manage who can sign in. Admins manage everything; Marshals enter
            results and run station check-in.
          </p>
        </div>
        <Button size="sm" onClick={openCreate}>
          + Add Member
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Members ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b text-zinc-500">
                <th className="py-2 font-normal">Name</th>
                <th className="py-2 font-normal">Username</th>
                <th className="py-2 font-normal">Role</th>
                <th className="py-2 font-normal">Status</th>
                <th className="py-2 font-normal w-64">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isSelf = u.id === currentUserId;
                return (
                  <tr key={u.id} className="border-b last:border-none hover:bg-zinc-50">
                    <td className="py-3 font-medium">
                      {u.name}
                      {isSelf && (
                        <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">
                          you
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-zinc-600 font-mono">{u.username}</td>
                    <td className="py-3">
                      <Select
                        value={u.role}
                        onValueChange={(v) => handleRoleChange(u, v as Role)}
                        disabled={isSelf}
                      >
                        <SelectTrigger className="h-8 w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="marshal">Marshal</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="py-3">
                      {u.isActive ? (
                        <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">Active</span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded bg-zinc-200">Inactive</span>
                      )}
                    </td>
                    <td className="py-3">
                      <div className="flex gap-1">
                        <Button variant="outline" size="sm" onClick={() => handleResetPassword(u)}>
                          Reset password
                        </Button>
                        <Button
                          variant={u.isActive ? 'destructive' : 'outline'}
                          size="sm"
                          onClick={() => handleToggleActive(u)}
                          disabled={isSelf && u.isActive}
                        >
                          {u.isActive ? 'Deactivate' : 'Reactivate'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Add OC Member</DialogTitle>
            <DialogDescription>
              Create a login for a committee member. Share the username and
              temporary password with them; they can change it later via an
              admin reset.
            </DialogDescription>
          </DialogHeader>

          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" name="name" required placeholder="e.g. Margaret Tan" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                required
                autoCapitalize="none"
                placeholder="e.g. margaret"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="role">Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="marshal">Marshal — results & check-in</SelectItem>
                  <SelectItem value="admin">Admin — full access</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Temporary password</Label>
              <Input
                id="password"
                name="password"
                type="text"
                required
                minLength={8}
                placeholder="At least 8 characters"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating…' : 'Create Member'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
