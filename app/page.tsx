export default function SACFunDayHome() {
  return (
    <div className="min-h-screen bg-zinc-50 font-sans">
      <div className="mx-auto max-w-5xl px-6 py-20">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-9 w-9 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-xl">S</div>
          <div>
            <div className="text-2xl font-semibold tracking-tight">SACFunDay</div>
            <div className="text-sm text-zinc-500 -mt-1">St. Augustine&apos;s Chapel</div>
          </div>
        </div>

        <h1 className="text-6xl font-semibold tracking-tighter text-balance mt-8 max-w-3xl">
          Fun Day management for St. Augustine&apos;s Chapel
        </h1>
        <p className="mt-6 max-w-xl text-xl text-zinc-600">
          Parent sign-up portal • QR check-in at stations • Fast result entry • Beautiful certificates for every child.
        </p>

        <div className="mt-10 flex flex-wrap gap-4">
          <a
            href="/portal"
            className="inline-flex h-12 items-center justify-center rounded-full bg-emerald-600 px-8 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Parent Sign-up Portal
          </a>
          <a
            href="/admin"
            className="inline-flex h-12 items-center justify-center rounded-full border px-8 text-sm font-medium hover:bg-white"
          >
            OC Admin Area
          </a>
        </div>

        <div className="mt-20 text-xs text-zinc-400">
          Project in active development. Parent portal is now available.
        </div>
      </div>
    </div>
  );
}
