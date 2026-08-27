import { cn } from "@/lib/utils";

/**
 * Airplane-window hero visual (B2B homepage) — matched to the reference:
 * a bright white cabin window with a blue sky, an orange-tipped wing and soft
 * white clouds. Rendered as SVG so it is crisp at any size and ships no image
 * weight. Pass `photoSrc` to render a real photograph in the same opening
 * instead (e.g. /hero-window.jpg).
 */
export function AirplaneWindow({ className, photoSrc }: { className?: string; photoSrc?: string }) {
  return (
    <div className={cn("relative", className)}>
      {/* Dotted texture (upper-left) + soft brand blob (behind-right). */}
      <div aria-hidden className="pointer-events-none absolute -left-4 top-6 -z-10 h-40 w-40 opacity-70 [background-image:radial-gradient(rgba(35,64,217,0.18)_1.4px,transparent_1.4px)] [background-size:16px_16px]" />
      <div aria-hidden className="pointer-events-none absolute right-0 top-10 -z-10 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(35,64,217,0.07),transparent_65%)]" />

      <svg
        viewBox="0 0 480 600"
        role="img"
        aria-label="View of an aircraft wing above the clouds through a cabin window"
        className="mx-auto h-auto w-full max-w-[460px] drop-shadow-[0_34px_80px_rgba(11,27,69,0.22)]"
      >
        <defs>
          <linearGradient id="etx-frame" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#e9edf3" />
          </linearGradient>
          <linearGradient id="etx-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4b90d6" />
            <stop offset="34%" stopColor="#82b4e2" />
            <stop offset="62%" stopColor="#cfe1f1" />
            <stop offset="84%" stopColor="#eef4fa" />
            <stop offset="100%" stopColor="#f6ead6" />
          </linearGradient>
          <linearGradient id="etx-wing" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#cdd6e2" />
            <stop offset="55%" stopColor="#eef2f7" />
            <stop offset="100%" stopColor="#f8fafc" />
          </linearGradient>
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

        {/* Pane content */}
        <g clipPath="url(#etx-pane)">
          <rect x="92" y="52" width="296" height="496" fill="url(#etx-sky)" />

          {/* Clouds — soft white banks in the lower half */}
          <g fill="#ffffff">
            <ellipse cx="240" cy="470" rx="230" ry="70" opacity="1" />
            <ellipse cx="150" cy="430" rx="92" ry="30" opacity="0.9" />
            <ellipse cx="300" cy="436" rx="108" ry="30" opacity="0.92" />
            <ellipse cx="205" cy="400" rx="56" ry="17" opacity="0.65" />
            <ellipse cx="290" cy="392" rx="44" ry="14" opacity="0.55" />
            <ellipse cx="130" cy="392" rx="34" ry="11" opacity="0.45" />
          </g>

          {/* Wing — light blade from lower-left up to the right, orange winglet */}
          <g>
            <path d="M92 508 L316 306 L352 316 L150 534 L92 534 Z" fill="url(#etx-wing)" />
            <path d="M92 508 L316 306 L352 316 L150 534 L92 534 Z" fill="none" stroke="#ffffff" strokeWidth="2" opacity="0.5" />
            {/* subtle panel lines */}
            <path d="M120 505 L305 340" stroke="#c3ccd9" strokeWidth="1.4" opacity="0.5" />
            <path d="M150 520 L322 352" stroke="#c3ccd9" strokeWidth="1.2" opacity="0.4" />
            {/* winglet (orange upturned tip) */}
            <path d="M316 306 L352 316 L368 258 L332 270 Z" fill="#ff6a1a" />
            <path d="M316 306 L352 316 L349 328 L318 318 Z" fill="#e85a0c" />
          </g>
        </g>

        {/* Pane inner highlight + window shade slot */}
        <rect x="92" y="52" width="296" height="496" rx="146" ry="150" fill="none" stroke="#ffffff" strokeWidth="7" opacity="0.5" />
        <rect x="184" y="536" width="112" height="16" rx="8" fill="#d4dbe6" />

        {photoSrc && (
          <image href={photoSrc} x="92" y="52" width="296" height="496" clipPath="url(#etx-pane)" preserveAspectRatio="xMidYMid slice" />
        )}
      </svg>
    </div>
  );
}
