import Link from 'next/link';
import { getPortalStatus } from '@/lib/portal';

export default async function PortalLanding() {
  const status = await getPortalStatus();

  return (
    <div className="min-h-screen bg-zinc-50 font-sans">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-10 w-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-2xl">S</div>
          <div>
            <div className="text-3xl font-semibold tracking-tight">SACFunDay</div>
            <div className="text-sm text-zinc-500 -mt-1">St. Augustine's Chapel</div>
          </div>
        </div>

        <h1 className="text-5xl font-semibold tracking-tight mb-4">
          Sign-up Portal
        </h1>
        
        <p className="text-2xl text-zinc-600 mb-8">
          {status.eventTitle}
        </p>

        <div className={`rounded-2xl p-8 mb-8 ${status.isOpen ? 'bg-emerald-50 border border-emerald-200' : 'bg-amber-50 border border-amber-200'}`}>
          <div className="text-lg font-medium mb-2">
            {status.isOpen ? '✅ Sign-ups are open' : '⏸️ Sign-ups are closed'}
          </div>
          <p className="text-zinc-700">
            {status.message}
          </p>
          {status.eventDate && (
            <p className="mt-2 text-sm text-zinc-500">
              Event date: {status.eventDate}
            </p>
          )}
        </div>

        {status.isOpen ? (
          <div className="space-y-4">
            <Link
              href="/portal/signup"
              className="inline-flex h-14 items-center justify-center rounded-full bg-emerald-600 px-10 text-lg font-medium text-white hover:bg-emerald-700 transition-colors w-full sm:w-auto"
            >
              Sign up my child(ren)
            </Link>

            <div>
              <Link
                href="/portal/retrieve"
                className="text-sm text-emerald-700 underline hover:text-emerald-800"
              >
                Forgot your QR code? Retrieve it here →
              </Link>
            </div>
          </div>
        ) : (
          <div className="text-sm text-zinc-500 space-y-2">
            <p>Sign-ups are currently closed.</p>
            <Link href="/portal/retrieve" className="text-emerald-700 underline">
              Need to retrieve a QR code? Click here →
            </Link>
          </div>
        )}

        <div className="mt-16 text-xs text-zinc-400">
          For questions, please contact St. Augustine's Chapel.
        </div>
      </div>
    </div>
  );
}
