import Link from "next/link";
import { Compass } from "lucide-react";
import { Container } from "@/components/ui/container";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-blueLight text-brand-blue">
        <Compass className="h-7 w-7" />
      </span>
      <h1 className="mt-6 text-3xl font-bold">Page not found</h1>
      <p className="mt-2 max-w-sm text-ink-muted">
        The page you&apos;re looking for doesn&apos;t exist or may have moved. Let&apos;s get you back on track.
      </p>
      <div className="mt-6 flex gap-3">
        <Link href="/" className={buttonVariants({ variant: "primary" })}>Go home</Link>
        <Link href="/packages" className={buttonVariants({ variant: "outline" })}>Browse packages</Link>
      </div>
    </Container>
  );
}
