import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ComponentType } from "react";
import {
  ArrowRight, BedDouble, CalendarRange, Car, Check, Coffee, Download, Info, Mail, MapPin, MessageCircle, Moon, Phone,
  Plane, Ship, Sun, Sunset, Ticket, Users, Utensils, Wallet, X,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { PrintButton } from "@/components/ui/print-button";
import { SmartImage } from "@/components/ui/smart-image";
import { getPackageBySlug } from "@/lib/queries";
import { extraPhones, getSiteSettings, promoIsActive, telLinkFor, whatsappLinkFor } from "@/lib/site-settings";
import { cn, formatDate, formatINR } from "@/lib/utils";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const pkg = await getPackageBySlug(slug);
  return {
    title: pkg ? `${pkg.name} — itinerary` : "Package itinerary",
    robots: { index: false, follow: true },
  };
}

const list = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.trim().length > 0) : []);

const KIND_ICON: Record<string, ComponentType<{ className?: string }>> = {
  FLIGHT: Plane, TRANSFER: Car, HOTEL: BedDouble, ACTIVITY: Ticket, MEAL: Utensils, FREE_TIME: Coffee, NOTE: Info,
};
const SLOTS = [
  { key: "MORNING", label: "Morning", icon: Sun, tone: "text-brand-orange" },
  { key: "AFTERNOON", label: "Afternoon", icon: Sunset, tone: "text-brand-blue" },
  { key: "EVENING", label: "Evening", icon: Moon, tone: "text-brand-navy" },
] as const;

function Heading({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-3 text-xl font-extrabold text-brand-navy">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-navy text-sm text-white">{n}</span>
      {children}
    </h2>
  );
}

function Glance({ icon: Icon, label, value }: { icon: ComponentType<{ className?: string }>; label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 rounded-xl border border-surface-border bg-white p-3.5 break-inside-avoid">
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-brand-blue" />
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-wider text-ink-faint">{label}</p>
        <p className="mt-0.5 text-sm font-semibold leading-snug text-brand-navy">{value}</p>
      </div>
    </div>
  );
}

export default async function ItineraryDocPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [pkg, settings] = await Promise.all([getPackageBySlug(slug), getSiteSettings()]);
  if (!pkg) notFound();
  const v = pkg.currentVersion!;

  const route = (Array.isArray(v.cityBreakdown) ? v.cityBreakdown : []) as { city: string; nights: number }[];
  const highlights = list(v.highlights);
  const inclusions = list(v.inclusions);
  const exclusions = list(v.exclusions);
  const goodToKnow = (v.importantInfo ?? "").split(/\n+/).map((s) => s.trim()).filter(Boolean);
  const priced = v.pricingStatus !== "PRICE_REVIEW_REQUIRED" && v.basePrice > 0;
  const cover = v.images[0]?.url ?? null;
  const gallery = v.images.slice(1, 4);
  const tel = telLinkFor(settings);
  const wa = whatsappLinkFor(settings, `Hello ${settings.brandName}, I'd like a quotation for the ${pkg.name} (${v.durationNights}N/${v.durationDays}D).`);
  const validity = promoIsActive(settings) || settings.promoValidTo
    ? `${formatDate(settings.promoValidFrom)} – ${formatDate(settings.promoValidTo)}`
    : null;

  return (
    <article className="mx-auto max-w-4xl px-4 py-6 sm:py-10 print:max-w-none print:px-0 print:py-0">
      {/* ── Actions (screen only) ─────────────────────────── */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href={`/packages/${pkg.slug}`} className="text-sm font-semibold text-brand-blue hover:underline">← Back to the package</Link>
        <div className="flex flex-wrap gap-2">
          <a href={`/packages/${pkg.slug}/itinerary.pdf`} download className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand-orange px-4 text-sm font-bold text-white hover:bg-brand-orangeDark">
            <Download className="h-4 w-4" /> Download PDF
          </a>
          <PrintButton label="Print" />
          {wa && (
            <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center gap-2 rounded-xl border border-surface-border bg-white px-4 text-sm font-bold text-brand-navy hover:border-[#25D366]">
              <MessageCircle className="h-4 w-4 text-[#25D366]" /> Ask on WhatsApp
            </a>
          )}
        </div>
      </div>

      {/* ── Cover ─────────────────────────────────────────── */}
      <header className="relative overflow-hidden rounded-3xl bg-brand-navy text-white print:rounded-none">
        {cover && (
          <div className="absolute inset-0">
            <SmartImage src={cover} alt={pkg.name} sizes="(max-width:900px) 100vw, 900px" priority className="h-full" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-brand-navy via-brand-navy/80 to-brand-navy/40" aria-hidden />
        <div className="relative flex min-h-[340px] flex-col justify-between gap-8 p-6 sm:p-9">
          <div className="flex items-start justify-between gap-4">
            <span className="rounded-2xl bg-white px-3 py-2"><Logo size="md" href={null} /></span>
            <div className="text-right text-xs text-white/75">
              <p className="font-bold uppercase tracking-[0.18em] text-brand-turquoise">Holiday itinerary</p>
              <p className="mt-1 font-mono">{pkg.code ?? pkg.slug}</p>
              <p>Prepared {formatDate(new Date())}</p>
            </div>
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand-turquoise">
              {v.durationNights} nights · {v.durationDays} days · Andaman Islands
            </p>
            <h1 className="mt-2 text-3xl font-extrabold leading-tight !text-white sm:text-5xl">{pkg.name}</h1>
            {v.summary && <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-white/85">{v.summary}</p>}
            <div className="mt-5 flex flex-wrap items-end gap-x-8 gap-y-3">
              {priced ? (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-white/60">Starting from</p>
                  <p className="tabular text-3xl font-extrabold">
                    {formatINR(v.basePrice)} <span className="text-base font-semibold text-white/70">per person</span>
                  </p>
                </div>
              ) : (
                <p className="text-xl font-extrabold">Price on request</p>
              )}
              {v.minTravellers > 1 && (
                <p className="rounded-full bg-white/15 px-3 py-1.5 text-sm font-bold">Minimum {v.minTravellers} travellers</p>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── Route ─────────────────────────────────────────── */}
      {route.length > 0 && (
        <section className="mt-6 rounded-2xl border border-surface-border bg-surface-muted/60 p-4 sm:p-5 break-inside-avoid">
          <p className="text-[11px] font-bold uppercase tracking-wider text-ink-faint">Your route</p>
          <ol className="mt-3 flex flex-wrap items-center gap-2">
            {route.map((r, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-xl bg-white px-3.5 py-2 shadow-card ring-1 ring-surface-border">
                  <MapPin className="h-4 w-4 text-brand-orange" />
                  <span className="text-sm font-bold text-brand-navy">{r.city}</span>
                  <span className="rounded-md bg-brand-blueLight px-1.5 py-0.5 text-xs font-extrabold text-brand-blue">{r.nights}N</span>
                </span>
                {i < route.length - 1 && <Ship className="h-4 w-4 text-brand-turquoise" aria-label="then" />}
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* ── At a glance ───────────────────────────────────── */}
      <section className="mt-8">
        <Heading n="1">Trip at a glance</Heading>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Glance icon={CalendarRange} label="Duration" value={`${v.durationNights} nights / ${v.durationDays} days`} />
          <Glance icon={BedDouble} label="Hotels" value={v.roomCategory} />
          <Glance icon={Utensils} label="Meals" value={v.mealPlan} />
          <Glance icon={Users} label="Group size" value={v.minTravellers > 1 ? `Rate for ${v.minTravellers} or more travellers` : "Any group size"} />
          <Glance icon={Plane} label="Arrival and departure" value="Veer Savarkar International Airport, Sri Vijaya Puram (Port Blair)" />
          <Glance icon={Wallet} label="Rates valid for travel" value={validity} />
        </div>
        {highlights.length > 0 && (
          <ul className="mt-4 grid gap-2 rounded-2xl border border-surface-border bg-white p-4 sm:grid-cols-2">
            {highlights.map((h, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-ink">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" /> {h}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── Day by day ────────────────────────────────────── */}
      <section className="mt-10">
        <Heading n="2">Day-by-day plan</Heading>
        <ol className="relative mt-5 space-y-5 before:absolute before:bottom-4 before:left-[19px] before:top-4 before:w-0.5 before:bg-surface-border">
          {v.days.map((day) => (
            <li key={day.id} className="relative pl-14 break-inside-avoid">
              <span className="absolute left-0 top-0 flex h-10 w-10 flex-col items-center justify-center rounded-full bg-brand-blue text-white shadow-card ring-4 ring-white">
                <span className="text-[9px] font-bold uppercase leading-none">Day</span>
                <span className="text-sm font-extrabold leading-none">{day.dayNumber}</span>
              </span>
              <div className="rounded-2xl border border-surface-border bg-white p-4 sm:p-5">
                <h3 className="text-base font-extrabold text-brand-navy sm:text-lg">{day.title}</h3>
                {day.summary && <p className="mt-1 text-sm leading-relaxed text-ink-muted">{day.summary}</p>}
                {day.items.length > 0 && (
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    {SLOTS.map((slot) => {
                      const items = day.items.filter((it) => it.timeslot === slot.key);
                      if (!items.length) return null;
                      return (
                        <div key={slot.key} className="rounded-xl bg-surface-muted/70 p-3">
                          <p className={cn("flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider", slot.tone)}>
                            <slot.icon className="h-3.5 w-3.5" /> {slot.label}
                          </p>
                          <ul className="mt-2 space-y-2">
                            {items.map((it) => {
                              const Icon = KIND_ICON[it.kind] ?? Info;
                              return (
                                <li key={it.id} className="flex items-start gap-2">
                                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-brand-blue" />
                                  <span className="text-sm leading-snug text-ink">
                                    <span className="font-semibold">{it.title}</span>
                                    {it.description && <span className="block text-xs leading-relaxed text-ink-muted">{it.description}</span>}
                                  </span>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>
      </section>

      {gallery.length > 0 && (
        <div className="mt-8 grid grid-cols-3 gap-3 print:hidden">
          {gallery.map((img) => (
            <div key={img.url} className="relative aspect-[4/3] overflow-hidden rounded-xl">
              <SmartImage src={img.url} alt={img.alt ?? pkg.name} sizes="300px" className="h-full" />
            </div>
          ))}
        </div>
      )}

      {/* ── Included / not included ───────────────────────── */}
      {(inclusions.length > 0 || exclusions.length > 0) && (
        <section className="mt-10">
          <Heading n="3">What&apos;s included</Heading>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {inclusions.length > 0 && (
              <div className="rounded-2xl border border-success/25 bg-[#F1FAF4] p-4 break-inside-avoid">
                <p className="text-sm font-extrabold text-success">Included</p>
                <ul className="mt-2 space-y-2">
                  {inclusions.map((x, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-ink"><Check className="mt-0.5 h-4 w-4 shrink-0 text-success" /> {x}</li>
                  ))}
                </ul>
              </div>
            )}
            {exclusions.length > 0 && (
              <div className="rounded-2xl border border-surface-border bg-surface-muted/60 p-4 break-inside-avoid">
                <p className="text-sm font-extrabold text-ink">Not included</p>
                <ul className="mt-2 space-y-2">
                  {exclusions.map((x, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-ink-muted"><X className="mt-0.5 h-4 w-4 shrink-0 text-danger" /> {x}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Price, payment and policies ───────────────────── */}
      <section className="mt-10">
        <Heading n="4">Price, payment and policies</Heading>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-brand-blue/20 bg-brand-blueLight/50 p-4 break-inside-avoid">
            <p className="text-sm font-extrabold text-brand-navy">Price</p>
            <p className="mt-1 text-sm leading-relaxed text-ink">
              {priced
                ? <>From <b className="tabular">{formatINR(v.basePrice)}</b> per person{v.minTravellers > 1 ? `, for ${v.minTravellers} or more travellers` : ""}.</>
                : <>Price on request — we quote it in writing for your dates and group.</>}
            </p>
            {settings.priceDisclaimer && <p className="mt-2 text-xs leading-relaxed text-ink-muted">{settings.priceDisclaimer}</p>}
          </div>
          <div className="rounded-2xl border border-surface-border bg-white p-4 break-inside-avoid">
            <p className="text-sm font-extrabold text-brand-navy">Payment</p>
            <ul className="mt-1 space-y-1 text-sm text-ink">
              <li>30% advance to confirm the booking</li>
              <li>Remaining 70% on arrival</li>
            </ul>
            <p className="mt-2 text-xs text-ink-muted">Unless your written quotation says otherwise. Use only payment details we send you.</p>
          </div>
        </div>
        {v.cancellationPolicy && (
          <div className="mt-4 rounded-2xl border border-surface-border bg-white p-4 break-inside-avoid">
            <p className="text-sm font-extrabold text-brand-navy">Cancellation</p>
            <p className="mt-1 text-sm leading-relaxed text-ink-muted">{v.cancellationPolicy}</p>
          </div>
        )}
        {goodToKnow.length > 0 && (
          <div className="mt-4 rounded-2xl border border-surface-border bg-white p-4 break-inside-avoid">
            <p className="text-sm font-extrabold text-brand-navy">Good to know</p>
            <ul className="mt-2 space-y-2">
              {goodToKnow.map((g, i) => (
                <li key={i} className="flex items-start gap-2 text-sm leading-relaxed text-ink-muted"><Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-blue" /> {g}</li>
              ))}
            </ul>
          </div>
        )}
        <p className="mt-3 text-xs text-ink-muted">
          These are summaries. The full <Link href="/terms" className="font-semibold text-brand-blue hover:underline">Terms &amp; Conditions</Link> apply to every booking.
        </p>
      </section>

      {/* ── Contact ───────────────────────────────────────── */}
      <footer className="mt-10 overflow-hidden rounded-3xl bg-brand-navy p-6 text-white sm:p-8 break-inside-avoid print:rounded-none">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="text-xl font-extrabold">Ready to book, or want changes?</p>
            <p className="mt-1 max-w-md text-sm text-white/75">
              Every itinerary can be adjusted — nights, islands and hotel category. Send us your dates and group size for a written quotation.
            </p>
            {wa && (
              <a href={wa} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex h-11 items-center gap-2 rounded-xl bg-[#25D366] px-5 text-sm font-bold text-white print:hidden">
                <MessageCircle className="h-4 w-4" /> Get my quotation on WhatsApp <ArrowRight className="h-4 w-4" />
              </a>
            )}
          </div>
          <ul className="space-y-2 text-sm">
            {tel && <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-brand-turquoise" /> <a href={tel} className="font-bold">{settings.phonePrimary}</a></li>}
            {extraPhones(settings.phoneSecondary).map((p) => (
              <li key={p.href} className="flex items-center gap-2 pl-6"><a href={p.href} className="text-white/80">{p.display}</a></li>
            ))}
            {settings.email && <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-brand-turquoise" /> <a href={`mailto:${settings.email}`}>{settings.email}</a></li>}
            {settings.addressLines.filter(Boolean).length > 0 && (
              <li className="flex items-start gap-2 text-white/75"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-turquoise" /> <span>{settings.addressLines.filter(Boolean).join(", ")}</span></li>
            )}
          </ul>
        </div>
        <p className="mt-6 border-t border-white/15 pt-4 text-xs text-white/60">
          {settings.brandName}{settings.poweredBy ? ` · Powered by ${settings.poweredBy}` : ""}. This itinerary is a plan, not a booking: hotels, ferries and prices are confirmed in writing at the time of booking, and ferry timings depend on sea conditions.
        </p>
      </footer>
    </article>
  );
}
