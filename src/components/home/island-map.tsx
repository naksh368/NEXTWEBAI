"use client";

import Link from "next/link";
import { Plane } from "lucide-react";
import { ISLAND_HIGHLANDS, ISLAND_PATHS, MAP_VIEWBOX, PLACE_POINTS } from "./andaman-map-data";
import { openPlanner } from "@/components/ai/planner-events";
import { cn } from "@/lib/utils";

/**
 * Illustrated map of the Andaman Islands for the homepage hero.
 *
 * Drawn from real coordinates (see scripts/generate-andaman-map.py), so the
 * islands sit where they really are relative to one another. Places we have a
 * guide for link to it; every other named place opens the AI trip planner with
 * a ready-made question, so the whole map is something to explore, not just
 * look at. Motion (boats, clouds) is CSS-only and switches off for anyone who
 * prefers reduced motion.
 */

type Place = {
  key: keyof typeof PLACE_POINTS;
  label: string;
  side: "left" | "right" | "below";
  /** Leader-line length in viewBox units. */
  reach?: number;
  /** Nudge the label vertically (viewBox units) to avoid neighbours. */
  dy?: number;
  href?: string;
  /** What to ask the planner when there is no guide page. */
  ask?: string;
  major?: boolean;
};

const PLACES: Place[] = [
  { key: "diglipur", label: "Diglipur", side: "right", reach: 58, ask: "Can you plan a trip that includes Diglipur and Ross & Smith Island?" },
  { key: "mayabunder", label: "Mayabunder", side: "right", reach: 62, ask: "Can you add Mayabunder to an Andaman itinerary?" },
  { key: "rangat", label: "Rangat", side: "right", reach: 58, ask: "What is there to see around Rangat?" },
  { key: "longIsland", label: "Long Island", side: "right", reach: 34, ask: "Can I visit Long Island and Lalaji Bay?" },
  { key: "baratang", label: "Baratang", side: "left", reach: 40, ask: "Can you plan a day trip to the Baratang limestone caves?" },
  { key: "havelock", label: "Havelock Island", side: "right", reach: 40, href: "/packages?destination=havelock-island", major: true },
  { key: "neil", label: "Neil Island", side: "right", reach: 36, href: "/packages?destination=neil-island", major: true },
  { key: "northBay", label: "Ross & North Bay", side: "left", reach: 52, dy: -22, href: "/packages?destination=north-bay-island" },
  { key: "portBlair", label: "Port Blair", side: "left", reach: 44, dy: 8, href: "/packages?destination=port-blair", major: true },
  { key: "barren", label: "Barren Island", side: "below", reach: 26, ask: "Can we see Barren Island, India's active volcano?" },
  { key: "littleAndaman", label: "Little Andaman", side: "right", reach: 34, ask: "Can you plan a trip to Little Andaman?" },
];

/** Ferry and boat routes (viewBox units). Simplified for illustration. */
const ROUTES = {
  pbHavelock: "M160 618 Q198 585 226 538",
  havelockNeil: "M234 538 Q256 556 243 574",
  neilPb: "M237 581 Q201 612 165 628",
  pbLittle: "M150 642 Q118 770 104 888",
  havelockBarren: "M240 524 Q362 438 470 446",
  pbDiglipur: "M146 612 Q86 410 206 168",
};

const { width: W, height: H } = MAP_VIEWBOX;
const pct = (v: number, of: number) => `${(v / of) * 100}%`;

export function IslandMap({ className }: { className?: string }) {
  return (
    <div className={cn("relative mx-auto w-full", className)} style={{ aspectRatio: `${W} / ${H}` }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="absolute inset-0 h-full w-full overflow-visible"
        role="img"
        aria-labelledby="andaman-map-title"
      >
        <title id="andaman-map-title">
          Illustrated map of the Andaman Islands, from Diglipur in the north to Little Andaman in the south, with
          Port Blair, Havelock and Neil Island marked
        </title>
        <defs>
          <linearGradient id="land" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#6cc394" />
            <stop offset="0.5" stopColor="#44a07a" />
            <stop offset="1" stopColor="#2e8068" />
          </linearGradient>
          <linearGradient id="highland" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#2f7d5f" />
            <stop offset="1" stopColor="#1f5f4b" />
          </linearGradient>
          <radialGradient id="volcano" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#8a6a55" />
            <stop offset="1" stopColor="#5d4636" />
          </radialGradient>
        </defs>

        {/* Ferry routes sit under the land so they appear to leave from the coast. */}
        <g fill="none" stroke="#087EBA" strokeWidth="2" strokeDasharray="5 6" strokeLinecap="round" opacity="0.5">
          {Object.values(ROUTES).map((d) => (
            <path key={d} d={d} />
          ))}
        </g>

        {/* Reef shallows, beach line, land, then the highland overlay. */}
        <g>
          {Object.entries(ISLAND_PATHS).map(([name, d]) => (
            <path key={`reef-${name}`} d={d} fill="none" stroke="#18B8CE" strokeOpacity="0.28" strokeWidth="11" strokeLinejoin="round" />
          ))}
          {Object.entries(ISLAND_PATHS).map(([name, d]) => (
            <path key={`beach-${name}`} d={d} fill="none" stroke="#F6E7BF" strokeWidth="3" strokeLinejoin="round" />
          ))}
          {Object.entries(ISLAND_PATHS).map(([name, d]) =>
            name === "barren" ? (
              <path key={name} d={d} fill="url(#volcano)" />
            ) : (
              <path key={name} d={d} fill="url(#land)" stroke="#2a7360" strokeOpacity="0.55" strokeWidth="0.9" strokeLinejoin="round" />
            )
          )}
          {/* Forested interior rising away from the coast. */}
          {Object.entries(ISLAND_HIGHLANDS).map(([name, d]) => (
            <path key={`hi-${name}`} d={d} fill="url(#highland)" opacity="0.32" />
          ))}
        </g>

        {/* Barren Island's active volcano — a wisp of smoke. The position lives
            on the outer group: a CSS animation's transform would replace an
            SVG transform attribute on the same element. */}
        <g transform={`translate(${PLACE_POINTS.barren[0]} ${PLACE_POINTS.barren[1] - 6})`}>
          <g className="map-smoke">
            <path d="M0 0 C-4 -8 4 -12 0 -20 C-3 -26 3 -30 0 -36" fill="none" stroke="#8d99a6" strokeWidth="2.4" strokeLinecap="round" />
          </g>
        </g>

        {/* Leader lines and place markers. */}
        {PLACES.map((p) => {
          const [x, y] = PLACE_POINTS[p.key];
          const reach = p.reach ?? 40;
          const ly = y + (p.dy ?? 0);
          const lx = p.side === "left" ? x - reach : p.side === "right" ? x + reach : x;
          const endY = p.side === "below" ? y + reach : ly;
          return (
            <g key={`m-${p.key}`}>
              <path
                d={`M${x} ${y} L${lx} ${endY}`}
                stroke="#102B4E"
                strokeOpacity="0.55"
                strokeWidth="1.3"
                fill="none"
              />
              <circle cx={x} cy={y} r={p.major ? 4.2 : 3} fill="#fff" stroke="#102B4E" strokeWidth="1.6" />
              {p.major && <circle cx={x} cy={y} r="9" fill="none" stroke="#F26535" strokeWidth="1.4" className="map-pulse" />}
            </g>
          );
        })}

        {/* Boats moving along three of the routes. */}
        {[
          { d: ROUTES.pbHavelock, dur: "14s", delay: "0s" },
          { d: ROUTES.neilPb, dur: "12s", delay: "-5s" },
          { d: ROUTES.havelockBarren, dur: "22s", delay: "-9s" },
        ].map((b) => (
          <g
            key={b.d}
            className="map-boat"
            style={{ offsetPath: `path("${b.d}")`, animationDuration: b.dur, animationDelay: b.delay }}
          >
            <g transform="scale(1.45) translate(-11 -9)">
              <path d="M1 8 L21 8 L18 13 L4 13 Z" fill="#fff" stroke="#102B4E" strokeWidth="1.1" strokeLinejoin="round" />
              <path d="M6 8 L6 4 L14 4 L16 8" fill="#18B8CE" stroke="#102B4E" strokeWidth="1" strokeLinejoin="round" />
              <path d="M2 15 Q11 17 20 15" stroke="#ffffff" strokeOpacity="0.9" strokeWidth="1.2" fill="none" />
            </g>
          </g>
        ))}

        {/* Compass rose. */}
        <g transform="translate(486 92)" aria-hidden="true">
          <circle r="30" fill="#ffffff" fillOpacity="0.55" stroke="#102B4E" strokeOpacity="0.25" />
          <path d="M0 -24 L6 0 L0 24 L-6 0 Z" fill="#102B4E" fillOpacity="0.18" />
          <path d="M0 -24 L6 0 L-6 0 Z" fill="#F26535" />
          <text y="-32" textAnchor="middle" fontSize="13" fontWeight="800" fill="#102B4E">N</text>
        </g>
      </svg>

      {/* Port Blair airport marker. */}
      <span
        className="pointer-events-none absolute flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-brand-navy text-white shadow-card"
        style={{ left: pct(PLACE_POINTS.portBlair[0] - 14, W), top: pct(PLACE_POINTS.portBlair[1] + 22, H) }}
        aria-hidden="true"
      >
        <Plane className="h-3.5 w-3.5 -rotate-45" />
      </span>

      {/* Place labels: real links, or a question for the planner. */}
      {PLACES.map((p) => {
        const [x, y] = PLACE_POINTS[p.key];
        const reach = p.reach ?? 40;
        const lx = p.side === "left" ? x - reach - 4 : p.side === "right" ? x + reach + 4 : x;
        const ly = p.side === "below" ? y + reach + 4 : y + (p.dy ?? 0);
        const pos =
          p.side === "left"
            ? "-translate-x-full -translate-y-1/2"
            : p.side === "right"
              ? "-translate-y-1/2"
              : "-translate-x-1/2";
        const cls = cn(
          "map-label absolute whitespace-nowrap rounded-md px-1.5 py-0.5 font-bold leading-tight text-brand-navy transition-colors",
          "underline decoration-brand-turquoise/70 decoration-2 underline-offset-[3px] hover:bg-white/85 hover:text-brand-blue focus-visible:bg-white",
          p.major ? "text-[clamp(11px,1.15vw,15px)]" : "text-[clamp(10px,1vw,13px)] italic",
          pos
        );
        const style = { left: pct(lx, W), top: pct(ly, H) };

        return p.href ? (
          <Link key={p.key} href={p.href} className={cls} style={style} title={`See packages visiting ${p.label}`}>
            {p.label}
          </Link>
        ) : (
          <button
            key={p.key}
            type="button"
            className={cls}
            style={style}
            onClick={() => openPlanner(p.ask)}
            title={`Ask our AI planner about ${p.label}`}
          >
            {p.label}
          </button>
        );
      })}
    </div>
  );
}
