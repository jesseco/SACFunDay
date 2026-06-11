"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { LogOut } from "lucide-react";
import { logout } from "@/app/login/actions";

export function LogoutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleLogout() {
    startTransition(async () => {
      await logout();
      router.push("/login");
      router.refresh();
    });
  }

  return (
    <button
      onClick={handleLogout}
      disabled={isPending}
      className="flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-700 disabled:opacity-50"
    >
      <LogOut className="h-3.5 w-3.5" />
      {isPending ? "Logging out…" : "Log out"}
    </button>
  );
}
