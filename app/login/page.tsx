"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { verifyPin } from "./actions";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("from") || "/admin";

  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await verifyPin(formData);
      if (result.error) {
        setError(result.error);
      } else {
        router.push(redirectTo);
        router.refresh();
      }
    });
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-xl">
          S
        </div>
        <h1 className="mt-4 text-xl font-semibold tracking-tight">
          SACFunDay Admin
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Enter the committee PIN to continue
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            type="password"
            name="pin"
            inputMode="numeric"
            autoComplete="off"
            autoFocus
            placeholder="Enter PIN"
            className="w-full rounded-md border border-zinc-300 px-4 py-3 text-center text-lg tracking-widest placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 text-center">{error}</p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-md bg-emerald-600 px-4 py-3 text-sm font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50"
        >
          {isPending ? "Checking…" : "Enter"}
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
