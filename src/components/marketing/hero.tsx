import Image from "next/image";
import { Plane, Wallet, LineChart, CreditCard, ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";

const BENEFITS = [
  { icon: Plane, title: "Best Flight Deals", desc: "Competitive fares across a connected supplier network." },
  { icon: Wallet, title: "Easy Wallet", desc: "Prepaid ExpertzWallet for fast, secure bookings." },
  { icon: LineChart, title: "Transparent Earnings", desc: "See the economics of every booking clearly." },
  { icon: CreditCard, title: "Future Credit", desc: "Build history toward greater purchasing power." },
];

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden brand-wash">
      <div className="container grid items-center gap-10 py-14 lg:grid-cols-[1.05fr_1fr] lg:py-20">
        {/* Copy */}
        <div className="animate-fade-in">
          <span className="eyebrow rounded-full border border-surface-border bg-white px-3 py-1.5 text-blue shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-orange" />
            India&apos;s Smarter B2B Flight Platform
          </span>

          <h1 className="mt-5 text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.4rem]">
            <span className="text-blue">Better Flights.</span>
            <br />
            <span className="text-orange">More Earnings.</span>
            <br />
            <span className="text-blue">Stronger Business.</span>
          </h1>

          <p className="mt-5 max-w-lg text-lg leading-relaxed text-ink-muted">
            Powerful tools, competitive fares and smarter business solutions built
            for travel agents.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <ButtonLink href="/register" variant="accent" size="lg">
              Become an Agent <ArrowRight size={18} />
            </ButtonLink>
            <ButtonLink href="/login" variant="outline" size="lg">
              Login
            </ButtonLink>
          </div>

          <div className="mt-8 flex items-center gap-6 text-sm text-ink-muted">
            <span className="flex items-center gap-2 font-bold text-navy">
              <span className="h-2 w-2 rounded-full bg-success" />
              Prepaid wallet
            </span>
            <span className="flex items-center gap-2 font-semibold">
              Transparent fares
            </span>
            <span className="hidden items-center gap-2 font-semibold sm:flex">
              GST-ready invoicing
            </span>
          </div>
        </div>

        {/* Airplane-window photograph */}
        <div className="relative animate-fade-in">
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl border border-surface-border shadow-pop sm:aspect-[5/4] lg:aspect-[4/5]">
            <Image
              src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1200&q=80"
              alt="View of an airplane wing over blue sky and soft clouds"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 45vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-navy/25 via-transparent to-transparent" />
          </div>

          {/* Floating fare glass card */}
          <div className="absolute -bottom-5 -left-3 hidden w-60 rounded-xl border border-surface-border bg-white/95 p-4 shadow-pop backdrop-blur sm:block">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-ink-faint">DEL → DXB</p>
                <p className="text-lg font-extrabold text-navy">₹18,500</p>
              </div>
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-blue-50 text-blue">
                <Plane size={18} />
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-[0.72rem] font-bold">
              <span className="text-ink-muted">Your earning</span>
              <span className="text-orange">+ ₹1,110</span>
            </div>
          </div>
        </div>
      </div>

      {/* Four benefits */}
      <div className="container pb-14">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {BENEFITS.map((b) => (
            <div
              key={b.title}
              className="rounded-xl border border-surface-border bg-white p-5 shadow-card transition-shadow hover:shadow-cardHover"
            >
              <span className="grid h-11 w-11 place-items-center rounded-lg bg-blue-50 text-blue">
                <b.icon size={20} />
              </span>
              <h3 className="mt-4 text-base font-extrabold text-navy">{b.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-ink-muted">{b.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
