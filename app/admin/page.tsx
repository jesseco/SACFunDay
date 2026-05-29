import { db } from "@/lib/db/client";
import { ageGroups, events, participants, guardians, registrations, settings } from "@/lib/db/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default async function AdminDashboard() {
  const [
    currentSettings,
    ags,
    evs,
    parts,
    guards,
    regs,
  ] = await Promise.all([
    db.select().from(settings).limit(1).get(),
    db.select().from(ageGroups),
    db.select().from(events),
    db.select().from(participants),
    db.select().from(guardians),
    db.select().from(registrations),
  ]);

  const agCount = ags.length;
  const evCount = evs.length;
  const kidCount = parts.length;
  const guardianCount = guards.length;
  const regCount = regs.length;

  const completedEvents = evs.filter(e => e.isComplete).length;
  const portalOpen = currentSettings?.portalOpen ?? false;

  const eventTitle = currentSettings?.eventTitle || "SAC Fun Day 2026";
  const eventDate = currentSettings?.eventDate || "Date not set";

  // Simple portal status text
  let portalStatus = "Closed";
  let portalStatusColor = "text-red-600 bg-red-100";

  if (portalOpen) {
    portalStatus = "Open";
    portalStatusColor = "text-emerald-600 bg-emerald-100";
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight">{eventTitle}</h1>
          <p className="text-zinc-600 mt-1 text-lg">{eventDate}</p>
          {currentSettings?.notes?.includes('OPERATOR:') && (
            <p className="text-sm text-emerald-700 mt-0.5">
              On duty: <strong>{currentSettings.notes.match(/OPERATOR:\s*(.+)/)?.[1]?.trim()}</strong>
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/settings"
            className="inline-flex items-center justify-center rounded-full border px-5 h-10 text-sm font-medium hover:bg-white"
          >
            Edit Event Day Settings
          </Link>
          <div className={`inline-flex items-center px-4 h-10 rounded-full text-sm font-medium ${portalStatusColor}`}>
            Parent Portal: <span className="ml-1.5 font-semibold">{portalStatus}</span>
          </div>
        </div>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Age Groups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-semibold">{agCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-semibold">
              {evCount}
              <span className="text-base font-normal text-zinc-500 ml-2">
                ({completedEvents} done)
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Participants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-semibold">{kidCount}</div>
            <p className="text-xs text-zinc-500 mt-1">{guardianCount} families</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Registrations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-semibold">{regCount}</div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Parent Sign-up Portal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${portalStatusColor}`}>
                  {portalStatus}
                </span>
              </div>
              <Link 
                href="/admin/settings" 
                className="text-sm text-emerald-700 hover:underline font-medium"
              >
                Manage →
              </Link>
            </div>
            <p className="text-xs text-zinc-500 mt-3">
              Control when parents can register their children
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-sm font-medium text-zinc-500 mb-3">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link 
            href="/admin/settings" 
            className="inline-flex items-center justify-center rounded-full border px-5 h-10 text-sm font-medium hover:bg-white"
          >
            Event Day & Portal Settings
          </Link>
          <Link 
            href="/admin/events" 
            className="inline-flex items-center justify-center rounded-full border px-5 h-10 text-sm font-medium hover:bg-white"
          >
            Manage Events
          </Link>
          <Link 
            href="/admin/participants" 
            className="inline-flex items-center justify-center rounded-full border px-5 h-10 text-sm font-medium hover:bg-white"
          >
            Manage Participants
          </Link>
          <Link 
            href="/admin/age-groups" 
            className="inline-flex items-center justify-center rounded-full border px-5 h-10 text-sm font-medium hover:bg-white"
          >
            Age Groups
          </Link>
        </div>
      </div>

      <div className="text-xs text-zinc-400">
        SACFunDay • St. Augustine's Chapel • Last updated just now
      </div>
    </div>
  );
}
