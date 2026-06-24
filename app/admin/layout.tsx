import Link from "next/link";
import { Users, Calendar, ClipboardList, Trophy, Settings, Home, UserCog, DollarSign, Target } from "lucide-react";
import { LogoutButton } from "./logout-button";
import { requireUser } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Defense-in-depth: re-check the session server-side, in addition to
  // the request guard in proxy.ts. Redirects to /login if not signed in.
  const user = await requireUser();
  const isAdmin = user.role === "admin";

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-white p-6 flex flex-col">
        <div className="mb-8">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded bg-emerald-600 flex items-center justify-center text-white font-bold">S</div>
            <div>
              <div className="font-semibold tracking-tight">SACFunDay</div>
              <div className="text-[10px] text-emerald-600 -mt-0.5">Jesse H. Co</div>
            </div>
          </div>
        </div>

        <nav className="space-y-1 text-sm">
          <Link href="/admin" className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-zinc-100 font-medium">
            <Home className="h-4 w-4" /> Dashboard
          </Link>
          {isAdmin && (
            <Link href="/admin/age-groups" className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-zinc-100">
              <Users className="h-4 w-4" /> Age Groups
            </Link>
          )}
          {isAdmin && (
            <Link href="/admin/events" className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-zinc-100">
              <Calendar className="h-4 w-4" /> Events
            </Link>
          )}
          <Link href="/admin/enrollment" className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-zinc-100">
            <DollarSign className="h-4 w-4" /> Enrollment & Lunch
          </Link>
          <Link href="/admin/event-participation" className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-zinc-100">
            <Target className="h-4 w-4" /> Event Participation
          </Link>
          <Link href="/admin/participants" className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-zinc-100">
            <Users className="h-4 w-4" /> Participants
          </Link>
          <Link href="/admin/results" className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-zinc-100">
            <Trophy className="h-4 w-4" /> Results
          </Link>
          <Link href="/admin/checkin" className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-zinc-100 font-medium">
            <ClipboardList className="h-4 w-4" /> Station Check-in
          </Link>
          {isAdmin && (
            <Link href="/admin/users" className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-zinc-100 font-medium">
              <UserCog className="h-4 w-4" /> OC Members
            </Link>
          )}
          {isAdmin && (
            <Link href="/admin/settings" className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-zinc-100 font-medium text-emerald-700">
              <Settings className="h-4 w-4" /> Event Day Settings
            </Link>
          )}
        </nav>

        <div className="mt-auto pt-6 space-y-3">
          <div className="rounded-md bg-zinc-50 px-3 py-2 text-xs">
            <div className="font-medium text-zinc-700">{user.name}</div>
            <div className="text-zinc-400 capitalize">{user.role}</div>
          </div>
          <LogoutButton />
          <div className="text-xs text-zinc-400">
            SACFunDay • by Jesse H. Co<br />
            Fun Day 2026
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 bg-zinc-50">
        {children}
      </main>
    </div>
  );
}
