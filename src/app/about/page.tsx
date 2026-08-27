import Link from "next/link";
import { SiteHeader } from "@/components/b2b/site-header";
import { SiteFooter } from "@/components/b2b/site-footer";
import { buttonVariants } from "@/components/ui/button";

export const metadata = { title: "About" };

export default function AboutPage() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-extrabold">About ExpertzTrip</h1>
        <div className="mt-6 space-y-4 text-ink-muted">
          <p>
            ExpertzTrip is a B2B travel platform built for India&apos;s travel agent network. We give
            agencies powerful booking tools, competitive fares, a prepaid booking balance and dedicated
            support — so they can serve their customers better and grow their business.
          </p>
          <p>
            We&apos;re launching, and we believe in honest numbers. You won&apos;t find inflated agent
            counts or fabricated testimonials here — only real capabilities and real production data as
            the platform grows.
          </p>
        </div>
        <div className="mt-8">
          <Link href="/register" className={buttonVariants({ variant: "orange" })}>Register Your Agency</Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
