'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Papa from 'papaparse';

type ParticipantEvent = {
  id: number;
  name: string;
};

type Participant = {
  id: number;
  name: string;
  bibNumber: string | null;
  ageGroup: string | null;
  guardianName: string;
  guardianPhone: string;
  events: ParticipantEvent[];
};

type Event = {
  id: number;
  name: string;
};

type Props = {
  participants: Participant[];
  events: Event[];
};

export default function EventParticipationClient({ participants, events }: Props) {
  const [selectedEventId, setSelectedEventId] = useState<string>('all');

  const filteredParticipants =
    selectedEventId === 'all'
      ? participants
      : participants.filter((p) => p.events.some((e) => e.id === parseInt(selectedEventId)));

  const exportCSV = () => {
    const headers = ['Participant Name', 'Bib #', 'Age Group', 'Guardian', 'Phone', 'Events'];
    const rows = filteredParticipants.map((p) => [
      p.name,
      p.bibNumber || '',
      p.ageGroup || '',
      p.guardianName,
      p.guardianPhone,
      p.events.map((e) => e.name).join('; '),
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sacfunday-event-participation.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Event Participation ({filteredParticipants.length} participants)
          </h1>
          <p className="text-sm text-zinc-500 mt-1">View which participants are registered for which events</p>
        </div>
        <Button variant="outline" onClick={exportCSV}>
          Export CSV
        </Button>
      </div>

      {/* Filter by Event */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filter by Event</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedEventId} onValueChange={(val) => setSelectedEventId(val || 'all')}>
            <SelectTrigger className="w-[300px]">
              <SelectValue placeholder="Select event" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              {events.map((event) => (
                <SelectItem key={event.id} value={event.id.toString()}>
                  {event.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Participation Table */}
      <Card>
        <CardHeader>
          <CardTitle>Participants & Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b text-zinc-500">
                  <th className="py-2 font-normal">Bib</th>
                  <th className="py-2 font-normal">Participant Name</th>
                  <th className="py-2 font-normal">Age Group</th>
                  <th className="py-2 font-normal">Guardian</th>
                  <th className="py-2 font-normal">Phone</th>
                  <th className="py-2 font-normal">Events</th>
                </tr>
              </thead>
              <tbody>
                {filteredParticipants.map((p) => (
                  <tr key={p.id} className="border-b last:border-0 hover:bg-zinc-50">
                    <td className="py-2.5 font-mono text-xs text-zinc-500">{p.bibNumber || '—'}</td>
                    <td className="py-2.5 font-medium">{p.name}</td>
                    <td className="py-2.5 text-zinc-600">{p.ageGroup}</td>
                    <td className="py-2.5">{p.guardianName}</td>
                    <td className="py-2.5 text-zinc-600">{p.guardianPhone}</td>
                    <td className="py-2.5">
                      {p.events.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {p.events.map((event) => (
                            <span
                              key={event.id}
                              className="inline-flex items-center text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded"
                            >
                              {event.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-zinc-400 text-xs">No events</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
