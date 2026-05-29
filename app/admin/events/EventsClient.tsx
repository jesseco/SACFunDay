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
import { createEvent, updateEvent, deleteEvent } from './actions';

type Event = {
  id: number;
  name: string;
  type: string;
  ageGroup: string | null;
  ageGroupId?: number;
  scheduledTime: string | null;
  location: string | null;
  isComplete: boolean;
};

type AgeGroupOption = {
  id: number;
  name: string;
};

interface EventsClientProps {
  events: Event[];
  ageGroups: AgeGroupOption[];
}

export default function EventsClient({ events: initialEvents, ageGroups }: EventsClientProps) {
  const [eventList, setEventList] = useState(initialEvents);
  const [isOpen, setIsOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openCreate = () => {
    setEditingEvent(null);
    setIsOpen(true);
  };

  const openEdit = (ev: Event) => {
    setEditingEvent(ev);
    setIsOpen(true);
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete event "${name}"?`)) return;
    await deleteEvent(id);
    setEventList(eventList.filter((e) => e.id !== id));
  };

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    try {
      if (editingEvent) {
        formData.append('id', editingEvent.id.toString());
        await updateEvent(formData);
      } else {
        await createEvent(formData);
      }
      setIsOpen(false);
      setEditingEvent(null);
      window.location.reload();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">Events</h1>
        <Button size="sm" onClick={openCreate}>
          + New Event
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Events ({eventList.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b text-zinc-500">
                <th className="py-2 font-normal">Event</th>
                <th className="py-2 font-normal">Age Group</th>
                <th className="py-2 font-normal">Time</th>
                <th className="py-2 font-normal">Location</th>
                <th className="py-2 font-normal">Status</th>
                <th className="py-2 font-normal w-24">Actions</th>
              </tr>
            </thead>
            <tbody>
              {eventList.map((ev) => (
                <tr key={ev.id} className="border-b last:border-none hover:bg-zinc-50">
                  <td className="py-3 font-medium">{ev.name}</td>
                  <td className="py-3 text-zinc-600">{ev.ageGroup || '—'}</td>
                  <td className="py-3 text-zinc-600">{ev.scheduledTime || '—'}</td>
                  <td className="py-3 text-zinc-600">{ev.location || '—'}</td>
                  <td className="py-3">
                    {ev.isComplete ? (
                      <span className="text-xs px-2 py-0.5 rounded bg-zinc-200">Complete</span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">Open</span>
                    )}
                  </td>
                  <td className="py-3">
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" onClick={() => openEdit(ev)}>
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(ev.id, ev.name)}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>
              {editingEvent ? 'Edit Event' : 'Create New Event'}
            </DialogTitle>
            <DialogDescription>
              Define an activity for a specific age group.
            </DialogDescription>
          </DialogHeader>

          <form action={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Event Name</Label>
              <Input
                id="name"
                name="name"
                defaultValue={editingEvent?.name ?? ''}
                placeholder="e.g. 100m Sprint or Egg & Spoon"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Type</Label>
                <Select name="type" defaultValue={editingEvent?.type ?? 'track'}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="track">Track</SelectItem>
                    <SelectItem value="field">Field</SelectItem>
                    <SelectItem value="relay">Relay</SelectItem>
                    <SelectItem value="novelty">Novelty</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="unit">Unit (optional)</Label>
                <Input
                  id="unit"
                  name="unit"
                  defaultValue={editingEvent?.type === 'track' ? 'seconds' : editingEvent?.type === 'field' ? 'meters' : ''}
                  placeholder="seconds / meters"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="ageGroupId">Age Group</Label>
              <Select name="ageGroupId" defaultValue={editingEvent?.ageGroupId?.toString() ?? ''}>
                <SelectTrigger>
                  <SelectValue placeholder="Select age group" />
                </SelectTrigger>
                <SelectContent>
                  {ageGroups.map((ag) => (
                    <SelectItem key={ag.id} value={ag.id.toString()}>
                      {ag.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="scheduledTime">Scheduled Time</Label>
                <Input
                  id="scheduledTime"
                  name="scheduledTime"
                  defaultValue={editingEvent?.scheduledTime ?? ''}
                  placeholder="09:30"
                />
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  name="location"
                  defaultValue={editingEvent?.location ?? ''}
                  placeholder="Station A"
                />
              </div>
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
                {isSubmitting ? 'Saving...' : editingEvent ? 'Update Event' : 'Create Event'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <p className="mt-6 text-xs text-zinc-400">
        Tip: You can now create and manage events directly from the admin.
      </p>
    </div>
  );
}
