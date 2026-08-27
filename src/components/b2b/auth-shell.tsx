import Link from "next/link";
import { Logo } from "@/components/ui/logo";

/** Centered card layout for the partner auth pages (register / login / reset). */
export function AuthShell({
  title,
  subtitle,
  children,
  wide,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  wide?: boolean;
  footer?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-surface-muted/40">
      <header className="border-b border-surface-border bg-white">
        <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <Logo size="md" />
          <Link href="/" className="text-sm font-semibold text-ink-muted hover:text-brand-blue">
            ← Back to Home
          </Link>
        </div>
      </header>
      <main id="main" className="flex flex-1 items-start justify-center px-4 py-10 sm:py-14">
        <div className={`w-full ${wide ? "max-w-3xl" : "max-w-md"}`}>
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-extrabold sm:text-3xl">{title}</h1>
            {subtitle && <p className="mt-2 text-ink-muted">{subtitle}</p>}
          </div>
          <div className="rounded-2xl border border-surface-border bg-white p-6 shadow-card sm:p-8">
            {children}
          </div>
          {footer && <div className="mt-5 text-center text-sm text-ink-muted">{footer}</div>}
        </div>
      </main>
    </div>
  );
}
