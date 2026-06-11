import Image from 'next/image';

export default function SACFunDayHome() {
  return (
    <div className="min-h-screen bg-zinc-50 font-sans">
      <div className="mx-auto max-w-6xl px-6 py-12">
        {/* Top branding */}
        <div className="flex items-center gap-3 mb-8">
          <div className="h-10 w-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-2xl">S</div>
          <div>
            <div className="text-3xl font-semibold tracking-tight">SACFunDay</div>
            <div className="text-sm text-zinc-500 -mt-1">St. Augustine&apos;s Chapel</div>
          </div>
        </div>

        {/* Hero with flier */}
        <div className="grid md:grid-cols-2 gap-10 items-center">
          {/* Text side */}
          <div>
            <h1 className="text-5xl md:text-6xl font-semibold tracking-tighter text-balance max-w-2xl">
              Fun Day management for St. Augustine&apos;s Chapel
            </h1>
            <p className="mt-6 max-w-lg text-xl text-zinc-600">
              Parent sign-up portal • QR check-in at stations • Fast result entry • Beautiful certificates for every child.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="/portal"
                className="inline-flex h-12 items-center justify-center rounded-full bg-emerald-600 px-8 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
              >
                Parent Sign-up Portal
              </a>
              <a
                href="/admin"
                className="inline-flex h-12 items-center justify-center rounded-full border px-8 text-sm font-medium hover:bg-white transition-colors"
              >
                OC Admin Area
              </a>
            </div>

            <p className="mt-6 text-xs text-zinc-400">
              Project in active development. Parent portal is now available.
            </p>
          </div>

          {/* Flier / Poster */}
          <div className="relative mx-auto w-full max-w-md md:max-w-none">
            <div className="overflow-hidden rounded-2xl shadow-2xl ring-1 ring-black/5 bg-white">
              <Image
                src="/images/SACFUNDAYFLIER.jpeg"
                alt="SAC Fun Day 2026 official flier / poster"
                width={800}
                height={1100}
                className="w-full h-auto object-contain"
                priority
              />
            </div>
            <p className="mt-3 text-center text-xs text-zinc-500 tracking-wide">
              Official SAC Fun Day 2026 flier
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
