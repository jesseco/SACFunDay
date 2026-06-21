import { db } from '@/lib/db/client';
import { settings } from '@/lib/db/schema';
import { updateEventDaySettings } from './actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function extractOperatorFromNotes(notes: string | null | undefined): string {
  if (!notes) return '';
  const match = notes.match(/OPERATOR:\s*(.+)/);
  return match ? match[1].trim() : '';
}

export default async function EventDaySettings() {
  const currentSettings = await db.select().from(settings).limit(1).get();

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-semibold tracking-tight mb-2">Event Day Settings</h1>
      <p className="text-zinc-600 mb-8">
        Manage overall event information and control the Parent Sign-up Portal.
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Event Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateEventDaySettings} className="space-y-6">
            <div>
              <Label htmlFor="eventTitle">Event Title</Label>
              <Input
                id="eventTitle"
                name="eventTitle"
                defaultValue={currentSettings?.eventTitle || 'SAC Fun Day 2026'}
              />
            </div>

            <div>
              <Label htmlFor="eventDate">Event Date</Label>
              <Input
                id="eventDate"
                name="eventDate"
                type="date"
                defaultValue={currentSettings?.eventDate || ''}
              />
            </div>

            <div>
              <Label htmlFor="description">Description / Welcome Message</Label>
              <textarea
                id="description"
                name="description"
                rows={3}
                className="w-full border rounded-lg p-3"
                defaultValue={currentSettings?.notes || ''}
                placeholder="Welcome message for parents..."
              />
            </div>

            <div>
              <Label htmlFor="mainLocation">Main Location / Venue</Label>
              <Input
                id="mainLocation"
                name="mainLocation"
                defaultValue=""
                placeholder="e.g. St. Augustine's Chapel grounds"
              />
            </div>

            <div>
              <Label htmlFor="currentOperator">Current Operator / On Duty OC</Label>
              <Input
                id="currentOperator"
                name="currentOperator"
                defaultValue={extractOperatorFromNotes(currentSettings?.notes)}
                placeholder="e.g. Margaret Tan"
              />
              <p className="text-xs text-zinc-500 mt-1">
                This name will be used as the default &quot;Entered by&quot; when recording results.
              </p>
            </div>

            <hr className="my-6" />

            <div>
              <h3 className="font-semibold mb-4">Parent Sign-up Portal</h3>

              <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-50 border border-emerald-200">
                <input
                  type="checkbox"
                  id="portalOpen"
                  name="portalOpen"
                  defaultChecked={currentSettings?.portalOpen ?? false}
                  className="h-5 w-5"
                />
                <Label htmlFor="portalOpen" className="cursor-pointer text-base">
                  <span className="font-semibold">
                    {currentSettings?.portalOpen ? '✅ Portal is OPEN' : '⏸️ Portal is CLOSED'}
                  </span>
                  <span className="block text-sm text-zinc-600 mt-1">
                    Check this box to allow parents to sign up
                  </span>
                </Label>
              </div>
            </div>

            <Button type="submit" className="mt-6">
              Save Event Day Settings
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
