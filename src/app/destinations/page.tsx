import type { Metadata } from "next";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { SmartImage } from "@/components/ui/smart-image";
import { EmptyState } from "@/components/ui/states";
import { getAllDestinations } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Destinations",
  description: "Explore holiday destinations — Dubai, Bali, Maldives, Thailand, Singapore, Europe and more.",
};

export default async function DestinationsPage() {
  const destinations = await getAllDestinations();

  return (
    <Container className="py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Destinations" }]} />
      <div className="mt-4">
        <h1 className="text-3xl font-bold">Explore destinations</h1>
        <p className="mt-1.5 text-ink-muted">Find your next holiday across our most-loved places.</p>
      </div>

      {destinations.length ? (
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {destinations.map((d, i) => (
            <Link
              key={d.id}
              href={`/destinations/${d.slug}`}
              className="group overflow-hidden rounded-2xl border border-surface-border bg-white shadow-card transition-shadow hover:shadow-cardHover"
            >
              <div className="relative aspect-[16/10]">
                <SmartImage src={d.thumbnail} alt={d.name} sizes="(max-width:640px) 100vw, 33vw" priority={i < 3} imgClassName="transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" aria-hidden />
                <div className="absolute bottom-0 p-4 text-white">
                  <h2 className="text-lg font-bold">{d.name}</h2>
                  <p className="flex items-center gap-1 text-sm text-white/85"><MapPin className="h-3.5 w-3.5" /> {d.country}</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-4">
                <p className="line-clamp-1 text-sm text-ink-muted">{d.shortSummary}</p>
                <span className="shrink-0 text-sm font-semibold text-brand-blue">{d._count.packages} pkgs</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState className="mt-8" title="No destinations yet" description="Destinations will appear here once published." />
      )}
    </Container>
  );
}
