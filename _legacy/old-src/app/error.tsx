"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // In production, forward to your error-tracking service (never leak stack to users).
    console.error(error);
  }, [error]);

  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FCE9E9] text-danger">
        <AlertTriangle className="h-7 w-7" />
      </span>
      <h1 className="mt-6 text-3xl font-bold">Something went wrong</h1>
      <p className="mt-2 max-w-sm text-ink-muted">
        We hit an unexpected error. Please try again — if it keeps happening, contact our support team.
      </p>
      <Button onClick={reset} className="mt-6">Try again</Button>
    </Container>
  );
}
