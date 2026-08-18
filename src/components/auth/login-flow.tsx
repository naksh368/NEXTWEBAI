"use client";

import { SignIn } from "@clerk/nextjs";

export function LoginFlow({ redirectTo = "/account" }: { redirectTo?: string }) {
  return (
    <div className="flex justify-center py-4">
      <SignIn
        routing="hash"
        fallbackRedirectUrl={redirectTo}
        appearance={{
          variables: {
            colorPrimary: "#2340d9",
            fontFamily: "Nunito, system-ui, sans-serif",
            borderRadius: "0.75rem",
          },
          elements: {
            card: "shadow-card border border-surface-border",
            formButtonPrimary: "bg-brand-blue hover:bg-brand-blueDark",
          },
        }}
      />
    </div>
  );
}
