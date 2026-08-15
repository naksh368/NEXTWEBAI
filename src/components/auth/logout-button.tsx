"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  return (
    <button
      onClick={async () => {
        setLoading(true);
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/");
        router.refresh();
      }}
      disabled={loading}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-danger disabled:opacity-50"
    >
      <LogOut className="h-4 w-4" /> Sign out
    </button>
  );
}
