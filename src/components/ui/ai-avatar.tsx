/**
 * ExpertzTrip AI avatar — a friendly, premium brand bot (blue head, orange
 * spark, soft smile). Self-contained colors so it reads well on any surface.
 */
export function AiAvatar({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} aria-hidden role="img">
      <defs>
        <linearGradient id="etx-ai-head" x1="6" y1="8" x2="26" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2E4CE8" />
          <stop offset="1" stopColor="#1B33AE" />
        </linearGradient>
      </defs>
      {/* antenna + spark */}
      <path d="M16 8V4.6" stroke="#FF6A1A" strokeWidth="2" strokeLinecap="round" />
      <circle cx="16" cy="3.4" r="2.4" fill="#FF6A1A" />
      <circle cx="16" cy="3.4" r="0.9" fill="#FFD9C2" />
      {/* side nubs */}
      <rect x="3.2" y="15" width="2.4" height="6" rx="1.2" fill="#C9D3FF" />
      <rect x="26.4" y="15" width="2.4" height="6" rx="1.2" fill="#C9D3FF" />
      {/* head */}
      <rect x="5.5" y="8" width="21" height="19" rx="7" fill="url(#etx-ai-head)" />
      {/* screen */}
      <rect x="8.5" y="11" width="15" height="12.5" rx="5" fill="#0B1440" opacity="0.35" />
      {/* eyes */}
      <circle cx="12.6" cy="17" r="2.1" fill="#FFFFFF" />
      <circle cx="19.4" cy="17" r="2.1" fill="#FFFFFF" />
      <circle cx="12.9" cy="17.3" r="0.9" fill="#2340D9" />
      <circle cx="19.7" cy="17.3" r="0.9" fill="#2340D9" />
      {/* smile */}
      <path d="M12.4 20.6c1.4 1.5 5.8 1.5 7.2 0" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
