import { cn } from "@/lib/utils";

/**
 * Airplane-window hero visual (B2B homepage).
 *
 * A self-contained SVG recreation of the reference hero: a bright white cabin
 * window looking out over an orange-tipped wing above the clouds at golden hour.
 * Rendered as SVG so it is crisp at any size, ships zero image weight and never
 * depends on an external asset.
 *
 * To use a real photograph instead, drop it at /public/hero-window.jpg and set
 * `photoSrc` — the frame, proportions and surround are already matched to the
 * brand, so it will slot straight into the same window opening.
 */
export function AirplaneWindow({ className, photoSrc }: { className?: string; photoSrc?: string }) {
  return (
    <div className={cn("relative", className)}>
      {/* Dotted texture top-left + soft brand blob, echoing the reference. */}
      <div aria-hidden className="pointer-events-none absolute -left-6 -top-4 -z-10 h-40 w-40 opacity-70 [background-image:radial-gradient(rgba(35,64,217,0.18)_1.4px,transparent_1.4px)] [background-size:16px_16px]" />
      <div aria-hidden className="pointer-events-none absolute -right-10 top-8 -z-10 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(35,64,217,0.08),transparent_65%)]" />

      <svg
        viewBox="0 0 480 600"
        role="img"
        aria-label="View of an aircraft wing above the clouds at golden hour, through a cabin window"
        className="mx-auto h-auto w-[86%] max-w-[420px] drop-shadow-[0_30px_70px_rgba(11,27,69,0.22)]"
      >
        <defs>
          <linearGradient id="etx-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2f74c9" />
            <stop offset="38%" stopColor="#6fa9df" />
            <stop offset="63%" stopColor="#bcd7ee" />
            <stop offset="82%" stopColor="#f4dcc0" />
            <stop offset="100%" stopColor="#f7c98f" />
          </linearGradient>
          <linearGradient id="etx-frame" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#e9edf3" />
          </linearGradient>
          <linearGradient id="etx-wing" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#e7ecf3" />
            <stop offset="60%" stopColor="#f6f8fb" />
            <stop offset="100%" stopColor="#cdd6e2" />
          </linearGradient>
          <radialGradient id="etx-sun" cx="72%" cy="80%" r="55%">
            <stop offset="0%" stopColor="#fff3dd" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#fff3dd" stopOpacity="0" />
          </radialGradient>
          {/* Rounded window opening reused as clip. */}
          <clipPath id="etx-pane">
            <rect x="96" y="70" width="288" height="460" rx="140" ry="150" />
          </clipPath>
        </defs>

        {/* Outer white frame */}
        <rect x="40" y="26" width="400" height="548" rx="176" ry="184" fill="url(#etx-frame)" />
        <rect x="40" y="26" width="400" height="548" rx="176" ry="184" fill="none" stroke="#d7dde7" strokeWidth="1.5" />
        {/* Inner bezel recess */}
        <rect x="74" y="52" width="332" height="496" rx="158" ry="166" fill="#eef1f6" />
        <rect x="86" y="62" width="308" height="476" rx="150" ry="158" fill="#e3e8f0" />

        {/* Sky pane */}
        <g clipPath="url(#etx-pane)">
          <rect x="96" y="70" width="288" height="460" fill="url(#etx-sky)" />
          <rect x="96" y="70" width="288" height="460" fill="url(#etx-sun)" />

          {/* Cloud bank near the horizon */}
          <g fill="#ffffff">
            <ellipse cx="230" cy="452" rx="220" ry="60" opacity="1" />
            <ellipse cx="150" cy="418" rx="86" ry="26" opacity="0.85" />
            <ellipse cx="300" cy="424" rx="104" ry="28" opacity="0.9" />
            <ellipse cx="210" cy="392" rx="52" ry="15" opacity="0.6" />
            <ellipse cx="286" cy="386" rx="40" ry="12" opacity="0.5" />
          </g>

          {/* Wing — blade from lower-left up to the right, orange winglet tip */}
          <g>
            <path d="M96 512 L300 336 L352 344 L150 530 L96 530 Z" fill="url(#etx-wing)" />
            <path d="M96 512 L300 336 L352 344 L150 530 L96 530 Z" fill="none" stroke="#ffffff" strokeWidth="2" opacity="0.55" />
            {/* winglet */}
            <path d="M300 336 L352 344 L366 286 L322 300 Z" fill="#2f4fd6" />
            <path d="M366 286 L322 300 L332 268 L372 262 Z" fill="#ff6a1a" />
            {/* warm light streak on the wing */}
            <path d="M120 512 L300 356 L316 360 L150 520 Z" fill="#ffffff" opacity="0.35" />
          </g>
        </g>

        {/* Pane inner highlight */}
        <rect x="96" y="70" width="288" height="460" rx="140" ry="150" fill="none" stroke="#ffffff" strokeWidth="7" opacity="0.5" />
        {/* Window shade slot */}
        <rect x="176" y="520" width="128" height="18" rx="9" fill="#d4dbe6" />

        {/* Optional real photo, clipped into the same opening. */}
        {photoSrc && (
          <image href={photoSrc} x="96" y="70" width="288" height="460" clipPath="url(#etx-pane)" preserveAspectRatio="xMidYMid slice" />
        )}
      </svg>
    </div>
  );
}
