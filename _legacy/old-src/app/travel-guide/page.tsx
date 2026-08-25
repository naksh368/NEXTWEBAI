import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { SmartImage } from "@/components/ui/smart-image";
import { EmptyState } from "@/components/ui/states";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Travel guides",
  description: "Expert travel guides — visas, best times to visit, itineraries and tips for your next holiday.",
};

export default async function TravelGuidePage() {
  const guides = await db.travelGuide.findMany({
    where: { isPublished: true },
    orderBy: { publishedAt: "desc" },
    include: { destination: { select: { name: true } } },
  }).catch(() => []);

  return (
    <>
      <section className="relative overflow-hidden dotted-bg border-b border-surface-border">
        <div className="absolute inset-0 hero-wash" aria-hidden />
        <Container className="relative py-12 sm:py-16">
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Travel Guide" }]} />
          <p className="mt-5 text-sm font-bold uppercase tracking-[0.16em] text-brand-orange">Plan smarter</p>
          <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-brand-navy sm:text-5xl">Travel guides</h1>
          <p className="mt-3 max-w-2xl text-lg text-ink-muted">Expert tips on visas, timing, itineraries and making the most of every destination.</p>
        </Container>
      </section>

      <Container className="py-10">
        {guides.length ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {guides.map((g, i) => (
              <Link key={g.id} href="/travel-guide" className="group flex flex-col overflow-hidden rounded-2xl border border-surface-border bg-white shadow-card transition-shadow hover:shadow-cardHover">
                <div className="relative aspect-[16/10]">
                  <SmartImage src={g.coverImage} alt={g.title} sizes="(max-width:640px) 100vw, 33vw" priority={i < 3} imgClassName="transition-transform duration-500 group-hover:scale-105" />
                </div>
                <div className="flex flex-1 flex-col p-5">
                  {g.destination && <p className="text-xs font-semibold uppercase tracking-wide text-brand-orange">{g.destination.name}</p>}
                  <h2 className="mt-1 line-clamp-2 font-semibold text-brand-navy group-hover:text-brand-blue">{g.title}</h2>
                  {g.excerpt && <p className="mt-1.5 line-clamp-2 text-sm text-ink-muted">{g.excerpt}</p>}
                  <div className="mt-auto flex items-center justify-between pt-4 text-sm">
                    <span className="text-ink-faint">{formatDate(g.publishedAt)}</span>
                    <span className="inline-flex items-center gap-1 font-semibold text-brand-blue">Read <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState icon={<BookOpen className="h-5 w-5" />} title="Guides coming soon" description="Our travel experts are writing destination guides. Check back shortly." action={{ label: "Browse destinations", href: "/destinations" }} />
        )}
      </Container>
    </>
  );
}
