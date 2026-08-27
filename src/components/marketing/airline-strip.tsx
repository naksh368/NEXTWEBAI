/**
 * "Trusted by Leading Partners" strip (matches the reference).
 *
 * Airline names are rendered as plain styled text wordmarks — NOT copies of the
 * airlines' trademarked logo artwork. If ExpertzTrip has official permission to
 * display the real logos, drop the asset files in /public and swap the <span>s
 * for <Image>.
 */
function Word({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={`text-xl font-extrabold tracking-tight sm:text-[1.7rem] ${className}`}>{children}</span>;
}

export function AirlineStrip() {
  return (
    <div>
      <div className="flex items-center justify-center gap-4">
        <span className="h-px w-16 bg-surface-border sm:w-28" aria-hidden />
        <h2 className="whitespace-nowrap text-base font-bold text-brand-navy sm:text-lg">Trusted by Leading Partners</h2>
        <span className="h-px w-16 bg-surface-border sm:w-28" aria-hidden />
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-x-10 gap-y-6 sm:gap-x-16">
        <Word className="text-[#16216b]">IndiGo</Word>
        <Word className="uppercase text-[#c8102e]">Air India</Word>
        <Word className="text-[#e2231a]">Spice<span className="text-[#f36f21]">Jet</span></Word>
        <Word><span className="text-[#ff6a1a]">Akasa</span> <span className="text-[#4b2e83]">Air</span></Word>
        <span className="text-lg font-semibold text-ink-faint">&amp; More</span>
      </div>
    </div>
  );
}
