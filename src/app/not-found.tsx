import Link from "next/link";
import { Compass, Home, Package, Phone } from "lucide-react";
import { Container } from "@/components/ui/container";
import { buttonVariants } from "@/components/ui/button";
import { getSiteSettings, telLinkFor } from "@/lib/site-settings";

export default async function NotFound() {
  const s = await getSiteSettings().catch(() => null);
  const tel = s ? telLinkFor(s) : null;

  return (
    <Container className="flex min-h-[65vh] flex-col items-center justify-center py-20 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-turquoiseLight text-brand-turquoiseDark">
        <Compass className="h-8 w-8" />
      </span>
      <p className="mt-6 text-sm font-bold uppercase tracking-[0.18em] text-brand-turquoiseDark">Error 404</p>
      <h1 className="mt-2.5 text-3xl sm:text-4xl">This page has drifted off the map</h1>
      <p className="mt-4 max-w-md text-[15px] leading-relaxed text-ink-muted">
        The page you are looking for does not exist, or it has moved. Let us point you back towards the islands.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className={buttonVariants({ variant: "primary" })}>
          <Home className="h-4 w-4" /> Go home
        </Link>
        <Link href="/packages" className={buttonVariants({ variant: "outline" })}>
          <Package className="h-4 w-4" /> Holiday packages
        </Link>
        {tel && (
          <a href={tel} className={buttonVariants({ variant: "outline" })}>
            <Phone className="h-4 w-4" /> Call us
          </a>
        )}
      </div>
    </Container>
  );
}
