import Link from "next/link";
import { LifeBuoy, Mail, LogIn } from "lucide-react";
import { SiteHeader } from "@/components/b2b/site-header";
import { SiteFooter } from "@/components/b2b/site-footer";
import { buttonVariants } from "@/components/ui/button";
import { businessNotifyEmail } from "@/lib/services/email";

export const metadata = { title: "Support" };

export default function SupportCenterPage() {
  const email = businessNotifyEmail();
  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-blueLight text-brand-blue">
          <LifeBuoy size={22} />
        </span>
        <h1 className="mt-5 text-3xl font-extrabold">Support</h1>
        <p className="mt-3 text-ink-muted">
          Registered partners can raise and track tickets from inside the portal. If you need help before
          you&apos;re signed in, reach us by email.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-surface-border bg-white p-6 shadow-card">
            <Mail size={20} className="text-brand-orange" />
            <h3 className="mt-3 font-bold">Email support</h3>
            <p className="mt-1 text-sm text-ink-muted">Write to our team and we&apos;ll get back to you.</p>
            <a href={`mailto:${email}`} className="mt-2 inline-block text-sm font-semibold text-brand-blue">{email}</a>
          </div>
          <div className="rounded-2xl border border-surface-border bg-white p-6 shadow-card">
            <LogIn size={20} className="text-brand-orange" />
            <h3 className="mt-3 font-bold">Partner support desk</h3>
            <p className="mt-1 text-sm text-ink-muted">Sign in to open a categorized support ticket.</p>
            <Link href="/login" className={buttonVariants({ variant: "outline", size: "sm", className: "mt-3" })}>Login</Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
