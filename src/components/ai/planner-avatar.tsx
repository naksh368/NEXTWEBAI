import { useId } from "react";
import { cn } from "@/lib/utils";

/**
 * Asha, the AI trip planner — an illustrated character rather than a photo,
 * so nobody mistakes the planner for a real member of staff. The headset says
 * "here to help"; the colours are the brand's own.
 */
export function PlannerAvatar({ size = 56, className }: { size?: number; className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={cn("shrink-0", className)}
      role="img"
      aria-label="Asha, AI trip planner"
    >
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#18B8CE" />
          <stop offset="1" stopColor="#087EBA" />
        </linearGradient>
        <clipPath id={`${id}-clip`}>
          <circle cx="32" cy="32" r="32" />
        </clipPath>
      </defs>

      <circle cx="32" cy="32" r="32" fill={`url(#${id}-bg)`} />
      <g clipPath={`url(#${id}-clip)`}>
        {/* Hair behind the shoulders */}
        <path d="M16.5 31 C16 17 24 11.5 32 11.5 C40.5 11.5 48 17 47.5 31 L48 46 C45 49 41 48.5 39 46 L39 32 L25 32 L25 46 C23 48.5 19 49 16 46 Z" fill="#2B1A12" />
        {/* Top */}
        <path d="M8 66 C10 51 21 45.5 32 45.5 C43 45.5 54 51 56 66 Z" fill="#F26535" />
        <path d="M26.5 46.2 L32 53 L37.5 46.2" fill="none" stroke="#ffffff" strokeOpacity="0.75" strokeWidth="1.6" strokeLinejoin="round" />
        {/* Neck */}
        <path d="M27.8 38 h8.4 v7.6 c0 2.4 -8.4 2.4 -8.4 0 Z" fill="#B57650" />
        {/* Face */}
        <ellipse cx="32" cy="29.5" rx="11.2" ry="12.6" fill="#C98A5E" />
        {/* Fringe */}
        <path d="M20.6 28 C20.8 19 26 14.6 32.2 14.6 C38.8 14.6 43.6 19 43.4 28 C40.4 22.6 36.4 20.6 32.6 20.2 C28.4 21.2 24.4 23.6 20.6 28 Z" fill="#2B1A12" />
        {/* Eyes, brows, smile, cheeks */}
        <path d="M25.6 25.6 q2 -1.2 4 0 M34.4 25.6 q2 -1.2 4 0" stroke="#2B1A12" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        <circle cx="27.6" cy="29.3" r="1.35" fill="#2B1A12" />
        <circle cx="36.4" cy="29.3" r="1.35" fill="#2B1A12" />
        <path d="M28.2 34.4 Q32 37.8 35.8 34.4" stroke="#7A3524" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        <circle cx="25.2" cy="33" r="2" fill="#F26535" opacity="0.22" />
        <circle cx="38.8" cy="33" r="2" fill="#F26535" opacity="0.22" />
        {/* Earrings */}
        <circle cx="20.8" cy="33.8" r="1.3" fill="#18B8CE" />
        <circle cx="43.2" cy="33.8" r="1.3" fill="#18B8CE" />
        {/* Headset */}
        <path d="M18.6 29 C18.6 14.5 45.4 14.5 45.4 29" stroke="#102B4E" strokeWidth="2.3" fill="none" strokeLinecap="round" />
        <rect x="16.4" y="26.6" width="4.6" height="7.6" rx="2.2" fill="#102B4E" />
        <rect x="43" y="26.6" width="4.6" height="7.6" rx="2.2" fill="#102B4E" />
        <path d="M19.4 34 C20.4 38.8 24.4 39.8 27.6 39.2" stroke="#102B4E" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        <circle cx="28.2" cy="39.1" r="1.5" fill="#102B4E" />
      </g>
    </svg>
  );
}
