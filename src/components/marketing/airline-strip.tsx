/**
 * "Book across India's leading airlines" strip.
 *
 * Airline names are rendered as plain styled text wordmarks — NOT copies of the
 * airlines' trademarked logo artwork. If ExpertzTrip has permission to display
 * official logos, drop the asset files in /public and swap the <span>s for
 * <Image>. The heading is deliberately factual ("book across", not "partnered
 * with") unless a real partnership is confirmed.
 */
const AIRLINES = [
  { name: "IndiGo", className: "text-[#0b3d91]" },
  { name: "Air India", className: "text-[#c8102e]" },
  { name: "SpiceJet", className: "text-[#e11b22]" },
  { name: "Akasa Air", className: "text-[#4b2e83]" },
  { name: "Vistara", className: "text-[#4b2e83]" },
];

export function AirlineStrip() {
  return (
    <div className="border-t border-surface-border pt-8">
      <p className="text-center text-sm font-bold uppercase tracking-[0.14em] text-ink-muted">
        Book across India&apos;s leading airlines
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-5 sm:gap-x-14">
        {AIRLINES.map((a) => (
          <span key={a.name} className={`text-xl font-extrabold tracking-tight sm:text-2xl ${a.className}`}>
            {a.name}
          </span>
        ))}
        <span className="text-lg font-semibold text-ink-faint">&amp; more</span>
      </div>
    </div>
  );
}
