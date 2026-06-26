'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Papa from 'papaparse';
import { useState } from 'react';
import { deleteGuardian } from './actions';

type Enrollment = {
  guardianId: number;
  guardianName: string;
  guardianPhone: string;
  guardianEmail: string | null;
  lunchAttendees: number;
  paymentProof: string | null;
  participantCount: number;
};

type Props = {
  enrollments: Enrollment[];
};

export default function EnrollmentClient({ enrollments }: Props) {
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const totalAttendees = enrollments.reduce((sum, e) => sum + e.lunchAttendees, 0);
  const totalRevenue = totalAttendees * 20;
  const paidCount = enrollments.filter(e => e.paymentProof).length;
  const unpaidCount = enrollments.filter(e => !e.paymentProof).length;

  const handleDelete = async (guardianId: number, guardianName: string) => {
    if (!confirm(`Delete enrollment for ${guardianName}? This will also delete all their participants and event registrations. This cannot be undone.`)) {
      return;
    }

    setDeletingId(guardianId);
    const result = await deleteGuardian(guardianId);
    setDeletingId(null);

    if (!result.success) {
      alert('Failed to delete enrollment. Please try again.');
    }
  };

  const exportCSV = () => {
    const headers = [
      'Guardian Name',
      'Phone',
      'Email',
      'Total Attendees',
      'Participants Competing',
      'Total Amount ($20 × attendees)',
      'Payment Status',
    ];
    const rows = enrollments.map((e) => [
      e.guardianName,
      e.guardianPhone,
      e.guardianEmail || '',
      e.lunchAttendees.toString(),
      e.participantCount.toString(),
      `$${e.lunchAttendees * 20}`,
      e.paymentProof ? 'Paid' : 'Not Paid',
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sacfunday-enrollment-lunch.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Enrollment & Lunch ({enrollments.length} families)
          </h1>
          <p className="text-sm text-zinc-500 mt-1">Track total enrollment, lunch count, and payments</p>
        </div>
        <Button variant="outline" onClick={exportCSV}>
          Export CSV
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-normal text-zinc-500">Total Families</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{enrollments.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-normal text-zinc-500">Total Attendees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{totalAttendees}</div>
            <p className="text-xs text-zinc-500 mt-1">Lunch count</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-normal text-zinc-500">Expected Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">${totalRevenue}</div>
            <p className="text-xs text-zinc-500 mt-1">{totalAttendees} × $20</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-normal text-zinc-500">Payment Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-semibold">
              <span className="text-emerald-600">{paidCount}</span>
              {' / '}
              <span className="text-amber-600">{unpaidCount}</span>
            </div>
            <p className="text-xs text-zinc-500 mt-1">Paid / Unpaid</p>
          </CardContent>
        </Card>
      </div>

      {/* Enrollment Table */}
      <Card>
        <CardHeader>
          <CardTitle>Enrollment Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b text-zinc-500">
                  <th className="py-2 font-normal">Guardian Name</th>
                  <th className="py-2 font-normal">Phone</th>
                  <th className="py-2 font-normal">Email</th>
                  <th className="py-2 font-normal text-center">Total Attendees</th>
                  <th className="py-2 font-normal text-center">Competing</th>
                  <th className="py-2 font-normal text-right">Amount</th>
                  <th className="py-2 font-normal">Payment</th>
                  <th className="py-2 font-normal text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {enrollments.map((e) => (
                  <tr key={e.guardianId} className="border-b last:border-0 hover:bg-zinc-50">
                    <td className="py-2.5 font-medium">{e.guardianName}</td>
                    <td className="py-2.5 text-zinc-600">{e.guardianPhone}</td>
                    <td className="py-2.5 text-zinc-600 text-xs">{e.guardianEmail || '—'}</td>
                    <td className="py-2.5 text-center">
                      {e.lunchAttendees > 0 ? (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded">
                          {e.lunchAttendees}
                        </span>
                      ) : (
                        <span className="text-zinc-400">0</span>
                      )}
                    </td>
                    <td className="py-2.5 text-center text-zinc-600">{e.participantCount}</td>
                    <td className="py-2.5 text-right font-medium">${e.lunchAttendees * 20}</td>
                    <td className="py-2.5">
                      {e.paymentProof ? (
                        <a
                          href={e.paymentProof}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded hover:bg-emerald-100"
                        >
                          ✓ View proof
                        </a>
                      ) : (
                        <span className="text-xs px-2 py-0.5 bg-amber-50 text-amber-700 rounded">
                          No proof
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 text-center">
                      <button
                        onClick={() => handleDelete(e.guardianId, e.guardianName)}
                        disabled={deletingId === e.guardianId}
                        className="text-xs px-2 py-1 text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                      >
                        {deletingId === e.guardianId ? 'Deleting...' : 'Delete'}
                      </button>
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
