import { cn } from "@/lib/utils";

/**
 * Airplane-window hero visual (B2B homepage).
 *
 * A self-contained SVG recreation of the reference hero: a premium rounded cabin
 * window looking out over a wing above the clouds, wrapped in a soft light-blue
 * surround so it integrates into the page rather than sitting on a dark panel.
 *
 * Rendered as SVG (not a photo) so the hero is crisp at any size, ships zero
 * image weight, and never depends on an external asset. To use a real photograph
 * instead, drop it in /public and replace the <image> target inside the window
 * clip — the frame, surround and proportions are already matched to the brand.
 */
export function AirplaneWindow({ className }: { className?: string }) {
  return (
    <div className={cn("relative", className)}>
      {/* Soft brand halo behind the window so it feels lit, not pasted on. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-6 -z-10 rounded-[2.5rem] bg-[radial-gradient(60%_60%_at_70%_25%,rgba(35,64,217,0.10),transparent_70%)]"
      />
      <svg
        viewBox="0 0 520 560"
        role="img"
        aria-label="View of an aircraft wing above the clouds through a cabin window"
        className="h-auto w-full drop-shadow-[0_24px_60px_rgba(11,27,69,0.18)]"
      >
        <defs>
          {/* Sky: warm horizon low, clear blue up top — matches the reference. */}
          <linearGradient id="etx-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2f6fd6" />
            <stop offset="42%" stopColor="#6ea8e6" />
            <stop offset="72%" stopColor="#cfe3f3" />
            <stop offset="100%" stopColor="#f6ede1" />
          </linearGradient>
          {/* Cabin wall — light, faintly cool grey plastic. */}
          <linearGradient id="etx-wall" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="55%" stopColor="#eef1f6" />
            <stop offset="100%" stopColor="#dfe4ec" />
          </linearGradient>
          {/* Inner window bezel. */}
          <linearGradient id="etx-bezel" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f7f9fc" />
            <stop offset="100%" stopColor="#c9d1de" />
          </linearGradient>
          <linearGradient id="etx-wing" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f4f7fb" />
            <stop offset="100%" stopColor="#c4cede" />
          </linearGradient>
          {/* The pane's rounded-rectangle opening, reused as a clip. */}
          <clipPath id="etx-pane">
            <rect x="150" y="70" width="220" height="420" rx="106" ry="120" />
          </clipPath>
        </defs>

        {/* Cabin wall panel */}
        <rect x="8" y="8" width="504" height="544" rx="52" fill="url(#etx-wall)" />
        <rect
          x="8"
          y="8"
          width="504"
          height="544"
          rx="52"
          fill="none"
          stroke="#ffffff"
          strokeWidth="2"
          opacity="0.7"
        />

        {/* Outer window recess */}
        <rect x="122" y="44" width="276" height="472" rx="134" ry="150" fill="url(#etx-bezel)" />
        <rect x="136" y="57" width="248" height="446" rx="122" ry="138" fill="#eaeef4" />

        {/* Sky inside the pane */}
        <g clipPath="url(#etx-pane)">
          <rect x="150" y="70" width="220" height="420" fill="url(#etx-sky)" />

          {/* Clouds — soft layered ovals over the horizon band */}
          <g fill="#ffffff">
            <ellipse cx="240" cy="392" rx="150" ry="34" opacity="0.95" />
            <ellipse cx="180" cy="360" rx="70" ry="20" opacity="0.7" />
            <ellipse cx="300" cy="366" rx="86" ry="22" opacity="0.75" />
            <ellipse cx="250" cy="430" rx="180" ry="46" opacity="1" />
            <ellipse cx="210" cy="330" rx="42" ry="12" opacity="0.5" />
          </g>

          {/* Wing — angled blade with a blue-and-orange tip, like the reference */}
          <g>
            <path d="M150 470 L322 300 L360 300 L214 490 L150 490 Z" fill="url(#etx-wing)" />
            <path d="M150 470 L322 300 L360 300 L214 490 L150 490 Z" fill="none" stroke="#ffffff" strokeWidth="2" opacity="0.6" />
            {/* Winglet */}
            <path d="M322 300 L360 300 L372 250 L340 262 Z" fill="#2340d9" />
            <path d="M372 250 L340 262 L349 236 L376 232 Z" fill="#ff6a1a" />
          </g>
        </g>

        {/* Inner bezel highlight on the pane edge */}
        <rect
          x="150"
          y="70"
          width="220"
          height="420"
          rx="106"
          ry="120"
          fill="none"
          stroke="#ffffff"
          strokeWidth="6"
          opacity="0.55"
        />
        {/* Window shade slot at the bottom */}
        <rect x="196" y="486" width="128" height="16" rx="8" fill="#d8dee8" />
      </svg>

      {/* Two floating stat chips — qualitative, no invented numbers. */}
      <div className="pointer-events-none absolute -left-3 top-10 hidden rounded-2xl border border-surface-border bg-white/95 px-4 py-3 shadow-card backdrop-blur sm:block">
        <p className="text-xs font-semibold text-ink-muted">Live fares</p>
        <p className="text-sm font-extrabold text-brand-navy">Compare &amp; book</p>
      </div>
      <div className="pointer-events-none absolute -right-2 bottom-14 hidden rounded-2xl border border-surface-border bg-white/95 px-4 py-3 shadow-card backdrop-blur sm:block">
        <p className="text-xs font-semibold text-ink-muted">Prepaid wallet</p>
        <p className="text-sm font-extrabold text-brand-blue">Instant balance</p>
      </div>
    </div>
  );
}
