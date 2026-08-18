"use client";

import { useClerk } from "@clerk/nextjs";

export function LogoutButton({ className }: { className?: string }) {
  const { signOut } = useClerk();
  return (
    <button onClick={() => signOut({ redirectUrl: "/" })} className={className}>
      Sign out
    </button>
  );
}
