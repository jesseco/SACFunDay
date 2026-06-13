'use client';

import { useState } from 'react';
import Papa from 'papaparse';
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
import { createParticipant, deleteParticipant, importParticipantsCSV } from './actions';

type Participant = {
  id: number;
  name: string;
  bib: string | null;
  ageGroup: string | null;
  ageGroupId: number | null;
  guardian: string;
  guardianPhone: string;
  guardianEmail: string | null;
  notes: string | null;
};

type AgeGroup = {
  id: number;
  name: string;
};

interface ParticipantsClientProps {
  participants: Participant[];
  ageGroups: AgeGroup[];
}

export default function ParticipantsClient({ participants: initialParticipants, ageGroups }: ParticipantsClientProps) {
  const [participants, setParticipants] = useState(initialParticipants);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [importStatus, setImportStatus] = useState<{ created: number; skipped: number } | null>(null);

  const [, setCsvFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<Record<string, unknown>[]>([]);

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete participant "${name}" and all their registrations?`)) return;
    await deleteParticipant(id);
    setParticipants(participants.filter((p) => p.id !== id));
  };

  const handleCreate = async (formData: FormData) => {
    setIsSubmitting(true);
    try {
      await createParticipant(formData);
      setIsCreateOpen(false);
      window.location.reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create participant');
    } finally {
      setIsSubmitting(false);
    }
  };

  // CSV Handling
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFile(file);
    setImportStatus(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setParsedRows(results.data as Record<string, unknown>[]);
      },
      error: (err) => {
        alert('Failed to parse CSV: ' + err.message);
      },
    });
  };

  const handleImport = async () => {
    if (parsedRows.length === 0) return;

    setIsSubmitting(true);
    try {
      const result = await importParticipantsCSV(parsedRows);
      setImportStatus(result);
      // Refresh after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      alert('Import failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const exportCSV = () => {
    const headers = ['Child Name', 'Age Group', 'Bib', 'Parent Name', 'Parent Phone', 'Parent Email'];
    const rows = participants.map((p) => [
      p.name,
      p.ageGroup || '',
      p.bib || '',
      p.guardian,
      p.guardianPhone,
      p.guardianEmail || '',
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sacfunday-participants.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">Participants ({participants.length})</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCSV}>
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => setIsImportOpen(true)}>
            Import CSV
          </Button>
          <Button onClick={() => setIsCreateOpen(true)}>+ Add Participant</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Participants</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b text-zinc-500">
                  <th className="py-2 font-normal">Bib</th>
                  <th className="py-2 font-normal">Child Name</th>
                  <th className="py-2 font-normal">Age Group</th>
                  <th className="py-2 font-normal">Parent / Guardian</th>
                  <th className="py-2 font-normal">Phone</th>
                  <th className="py-2 font-normal w-20">Actions</th>
                </tr>
              </thead>
              <tbody>
                {participants.map((p) => {
                  return (
                    <tr key={p.id} className="border-b last:border-0 hover:bg-zinc-50">
                      <td className="py-2.5 font-mono text-xs text-zinc-500">{p.bib || '—'}</td>
                      <td className="py-2.5 font-medium">
                        {p.name}
                      </td>
                      <td className="py-2.5 text-zinc-600">{p.ageGroup}</td>
                      <td className="py-2.5">{p.guardian}</td>
                      <td className="py-2.5 text-zinc-600">{p.guardianPhone}</td>
                      <td className="py-2.5">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(p.id, p.name)}
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Create Participant Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Participant</DialogTitle>
            <DialogDescription>
              Child will be automatically registered to all suitable events for their age group.
            </DialogDescription>
          </DialogHeader>
          <form action={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="childName">Child Name</Label>
                <Input id="childName" name="childName" required />
              </div>
              <div>
                <Label htmlFor="bibNumber">Bib Number (optional)</Label>
                <Input id="bibNumber" name="bibNumber" />
              </div>
            </div>

            <div>
              <Label>Age Group</Label>
              <Select name="ageGroupId" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select age group" />
                </SelectTrigger>
                <SelectContent>
                  {ageGroups.map((ag) => (
                    <SelectItem key={ag.id} value={ag.id.toString()}>{ag.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="border-t pt-4">
              <div className="font-medium mb-2">Parent / Guardian</div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="guardianName">Parent Name</Label>
                  <Input id="guardianName" name="guardianName" required />
                </div>
                <div>
                  <Label htmlFor="guardianPhone">Phone</Label>
                  <Input id="guardianPhone" name="guardianPhone" required />
                </div>
              </div>
              <div className="mt-3">
                <Label htmlFor="guardianEmail">Email (optional)</Label>
                <Input id="guardianEmail" name="guardianEmail" type="email" />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Adding...' : 'Add Participant'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* CSV Import Dialog */}
      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Import Participants from CSV</DialogTitle>
            <DialogDescription>
              Upload a CSV with columns: <strong>Child Name, Age Group, Parent Name, Parent Phone</strong> (Email and Bib optional).
              Children will be registered to all events for their age group.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Input type="file" accept=".csv" onChange={handleFileChange} />

            {parsedRows.length > 0 && (
              <div className="text-sm bg-zinc-100 p-3 rounded">
                Found <strong>{parsedRows.length}</strong> rows in the file.
              </div>
            )}

            {importStatus && (
              <div className="text-sm p-3 bg-emerald-50 text-emerald-700 rounded">
                Import complete: <strong>{importStatus.created}</strong> created, <strong>{importStatus.skipped}</strong> skipped.
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsImportOpen(false); setParsedRows([]); setCsvFile(null); }}>
              Cancel
            </Button>
            <Button onClick={handleImport} disabled={parsedRows.length === 0 || isSubmitting}>
              {isSubmitting ? 'Importing...' : 'Import Participants'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <p className="mt-6 text-xs text-zinc-400">
        Tip: Use &quot;Export CSV&quot; to get a template, then re-import after editing in Excel/Google Sheets.
      </p>
    </div>
  );
}
