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
import { createAgeGroup, updateAgeGroup, deleteAgeGroup } from './actions';

type AgeGroup = {
  id: number;
  name: string;
  sortOrder: number;
};

interface AgeGroupsClientProps {
  groups: AgeGroup[];
}

export default function AgeGroupsClient({ groups: initialGroups }: AgeGroupsClientProps) {
  const [groups, setGroups] = useState(initialGroups);
  const [isOpen, setIsOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<AgeGroup | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openCreate = () => {
    setEditingGroup(null);
    setIsOpen(true);
  };

  const openEdit = (group: AgeGroup) => {
    setEditingGroup(group);
    setIsOpen(true);
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete age group "${name}"?`)) return;

    await deleteAgeGroup(id);
    setGroups(groups.filter((g) => g.id !== id));
  };

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true);

    try {
      if (editingGroup) {
        formData.append('id', editingGroup.id.toString());
        await updateAgeGroup(formData);
      } else {
        await createAgeGroup(formData);
      }

      setIsOpen(false);
      setEditingGroup(null);
      window.location.reload();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">Age Groups</h1>
        <Button size="sm" onClick={openCreate}>
          + Add Age Group
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sunday School Classes ({groups.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {groups.length === 0 && (
              <p className="text-sm text-zinc-500">No age groups yet.</p>
            )}
            {groups.map((g) => (
              <div
                key={g.id}
                className="flex items-center justify-between border rounded-lg px-4 py-3 bg-white"
              >
                <div>
                  <div className="font-medium">{g.name}</div>
                  <div className="text-xs text-zinc-400">Sort order: {g.sortOrder}</div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEdit(g)}>
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(g.id, g.name)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingGroup ? 'Edit Age Group' : 'Create New Age Group'}
            </DialogTitle>
            <DialogDescription>
              Age groups represent your Sunday School classes and adult bands (e.g. Kindergarten, Lower Primary (P.1-3), University+, Ages 60+, etc.)
            </DialogDescription>
          </DialogHeader>

          <form action={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                defaultValue={editingGroup?.name ?? ''}
                placeholder="e.g. Lower Primary (P.1-3) or Ages 45-60"
                required
              />
            </div>

            <div>
              <Label htmlFor="sortOrder">Sort Order</Label>
              <Input
                id="sortOrder"
                name="sortOrder"
                type="number"
                defaultValue={editingGroup?.sortOrder ?? 0}
              />
              <p className="text-xs text-zinc-500 mt-1">
                Lower numbers appear first
              </p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : editingGroup ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div className="mt-8 text-xs text-zinc-400">
        Changes are saved to the database. Refresh the page after saving for now.
      </div>
    </div>
  );
}
