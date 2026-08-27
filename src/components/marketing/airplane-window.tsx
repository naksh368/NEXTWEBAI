import { cn } from "@/lib/utils";

/**
 * Airplane-window hero visual (B2B homepage).
 *
 * Renders a real golden-hour wing-over-clouds photograph inside a bright white
 * cabin-window frame, matching the reference. The photo (public/hero-window.jpg,
 * an Unsplash free-license image) is clipped into the window opening; the SVG
 * only draws the frame, bezel and highlights around it.
 *
 * To use a different photo, replace /public/hero-window.jpg (any aspect ratio —
 * it is center-cropped to fill the opening).
 */
export function AirplaneWindow({ className, photoSrc = "/hero-window.jpg" }: { className?: string; photoSrc?: string }) {
  return (
    <div className={cn("relative", className)}>
      {/* Dotted texture (upper-left) + soft brand blob (behind-right), like the reference. */}
      <div aria-hidden className="pointer-events-none absolute -left-4 top-6 -z-10 h-40 w-40 opacity-70 [background-image:radial-gradient(rgba(35,64,217,0.18)_1.4px,transparent_1.4px)] [background-size:16px_16px]" />
      <div aria-hidden className="pointer-events-none absolute right-0 top-10 -z-10 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(35,64,217,0.07),transparent_65%)]" />

      <svg
        viewBox="0 0 480 600"
        role="img"
        aria-label="View of an aircraft wing above the clouds at golden hour, through a cabin window"
        className="mx-auto h-auto w-full max-w-[460px] drop-shadow-[0_34px_80px_rgba(11,27,69,0.22)]"
      >
        <defs>
          <linearGradient id="etx-frame" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#e9edf3" />
          </linearGradient>
          {/* Fallback sky if the photo is unavailable. */}
          <linearGradient id="etx-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2f74c9" />
            <stop offset="55%" stopColor="#bcd7ee" />
            <stop offset="100%" stopColor="#f7c98f" />
          </linearGradient>
          {/* The tall rounded window opening, reused as a clip. */}
          <clipPath id="etx-pane">
            <rect x="92" y="52" width="296" height="496" rx="146" ry="150" />
          </clipPath>
        </defs>

        {/* Outer white frame */}
        <rect x="34" y="20" width="412" height="560" rx="188" ry="196" fill="url(#etx-frame)" />
        <rect x="34" y="20" width="412" height="560" rx="188" ry="196" fill="none" stroke="#d7dde7" strokeWidth="1.5" />
        {/* Inner bezel recess */}
        <rect x="68" y="44" width="344" height="512" rx="168" ry="176" fill="#eef1f6" />
        <rect x="80" y="54" width="320" height="492" rx="158" ry="166" fill="#e3e8f0" />

        {/* Pane content — real photo, else a painted sky. */}
        <g clipPath="url(#etx-pane)">
          <rect x="92" y="52" width="296" height="496" fill="url(#etx-sky)" />
          {photoSrc && (
            <image href={photoSrc} x="92" y="52" width="296" height="496" preserveAspectRatio="xMidYMid slice" />
          )}
        </g>

        {/* Pane inner highlight + window shade slot, on top of the photo */}
        <rect x="92" y="52" width="296" height="496" rx="146" ry="150" fill="none" stroke="#ffffff" strokeWidth="7" opacity="0.5" />
        <rect x="184" y="536" width="112" height="16" rx="8" fill="#d4dbe6" />
      </svg>
    </div>
  );
}
