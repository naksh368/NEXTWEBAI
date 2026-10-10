#!/usr/bin/env python3
# Regenerate the illustrated Andaman map outlines:
#   python3 scripts/generate-andaman-map.py
# Edit the lon/lat control points below, then rerun.
"""Generate smooth island outlines for the Andaman map from rough lon/lat
control points. Output: a TypeScript module with path strings in a 560x1000
viewBox. Coastline texture comes from deterministic noise, so the output is
stable between runs."""
import math, json, random

W, H = 560, 1000
LON0, LAT0 = 92.20, 13.78
KX, KY = 290.0, 296.0

def proj(lon, lat):
    return ((lon - LON0) * KX, (LAT0 - lat) * KY)

ISLANDS = {
  "northAndaman": [(92.95,13.68),(93.02,13.66),(93.05,13.60),(93.03,13.55),(93.08,13.50),(93.10,13.42),(93.07,13.37),(93.10,13.30),(93.08,13.21),(93.04,13.16),(93.06,13.08),(93.02,13.00),(92.97,12.95),(92.90,12.96),(92.87,13.02),(92.85,13.12),(92.89,13.18),(92.86,13.26),(92.88,13.36),(92.86,13.45),(92.90,13.52),(92.89,13.61)],
  "middleAndaman": [(92.87,12.91),(92.93,12.89),(92.97,12.83),(92.95,12.78),(93.00,12.72),(93.01,12.64),(92.97,12.60),(92.99,12.52),(92.96,12.45),(92.93,12.40),(92.92,12.34),(92.86,12.29),(92.80,12.31),(92.77,12.37),(92.73,12.42),(92.75,12.48),(92.71,12.55),(92.72,12.64),(92.76,12.69),(92.74,12.77),(92.79,12.84)],
  "baratang": [(92.77,12.25),(92.84,12.23),(92.87,12.15),(92.84,12.07),(92.78,12.04),(92.73,12.08),(92.72,12.17)],
  "southAndaman": [(92.66,12.02),(92.73,12.02),(92.78,11.96),(92.76,11.91),(92.80,11.85),(92.78,11.79),(92.75,11.76),(92.77,11.70),(92.74,11.66),(92.75,11.61),(92.71,11.56),(92.67,11.51),(92.61,11.51),(92.58,11.56),(92.60,11.62),(92.56,11.67),(92.57,11.75),(92.61,11.80),(92.58,11.86),(92.61,11.93)],
  "rutland": [(92.61,11.47),(92.67,11.45),(92.69,11.39),(92.66,11.34),(92.61,11.35),(92.59,11.41)],
  "interview": [(92.68,12.99),(92.72,12.98),(92.73,12.90),(92.70,12.86),(92.66,12.89)],
  "longIsland": [(93.01,12.41),(93.06,12.40),(93.07,12.35),(93.03,12.33),(92.99,12.36)],
  "havelock": [(92.95,12.07),(92.99,12.07),(93.02,12.03),(93.05,12.02),(93.06,11.97),(93.03,11.95),(93.04,11.92),(92.99,11.92),(92.97,11.96),(92.94,11.97),(92.93,12.02)],
  "henryLawrence": [(93.07,12.17),(93.11,12.16),(93.12,12.12),(93.08,12.11)],
  "johnLawrence": [(92.98,12.14),(93.02,12.13),(93.02,12.09),(92.98,12.09)],
  "neil": [(93.00,11.86),(93.04,11.86),(93.07,11.84),(93.06,11.81),(93.02,11.80),(92.99,11.82)],
  "littleAndaman": [(92.51,10.91),(92.58,10.88),(92.62,10.80),(92.62,10.70),(92.59,10.60),(92.54,10.52),(92.48,10.54),(92.45,10.63),(92.45,10.74),(92.47,10.84)],
  "barren": [(93.840,12.300),(93.875,12.296),(93.885,12.272),(93.862,12.255),(93.836,12.265)],
}

def catmull(points, samples=8):
    n = len(points); out = []
    for i in range(n):
        p0, p1, p2, p3 = points[(i-1)%n], points[i], points[(i+1)%n], points[(i+2)%n]
        for s in range(samples):
            t = s / samples; t2, t3 = t*t, t*t*t
            x = 0.5*((2*p1[0]) + (-p0[0]+p2[0])*t + (2*p0[0]-5*p1[0]+4*p2[0]-p3[0])*t2 + (-p0[0]+3*p1[0]-3*p2[0]+p3[0])*t3)
            y = 0.5*((2*p1[1]) + (-p0[1]+p2[1])*t + (2*p0[1]-5*p1[1]+4*p2[1]-p3[1])*t2 + (-p0[1]+3*p1[1]-3*p2[1]+p3[1])*t3)
            out.append((x, y))
    return out

def roughen(pts, amount, seed):
    """Displace each point along its local normal by layered periodic noise,
    so coastlines get small headlands and coves instead of a smooth outline."""
    rnd = random.Random(seed); n = len(pts)
    phases = [rnd.random()*math.tau for _ in range(4)]
    freqs = [3, 7, 13, 23]
    weights = [0.45, 0.3, 0.17, 0.08]
    offs = []
    for i in range(n):
        t = i / n * math.tau
        v = sum(w*math.sin(f*t + ph) for f, w, ph in zip(freqs, weights, phases))
        v += (rnd.random()-0.5)*0.25
        offs.append(v*amount)
    out = []
    for i in range(n):
        (x0, y0), (x1, y1) = pts[i-1], pts[(i+1) % n]
        tx, ty = x1-x0, y1-y0; tl = math.hypot(tx, ty) or 1
        nx, ny = ty/tl, -tx/tl
        out.append((pts[i][0] + nx*offs[i], pts[i][1] + ny*offs[i]))
    # One light smoothing pass keeps it organic rather than spiky.
    return [((out[i-1][0]+2*out[i][0]+out[(i+1)%n][0])/4, (out[i-1][1]+2*out[i][1]+out[(i+1)%n][1])/4) for i in range(n)]

def inner(pts, k):
    """A shrunken copy toward the centroid: drawn lighter, it reads as the
    forested interior rising away from the coast."""
    n = len(pts); cx = sum(p[0] for p in pts)/n; cy = sum(p[1] for p in pts)/n
    return [(cx + (x-cx)*k, cy + (y-cy)*k) for x, y in pts]

def to_path(pts):
    s = f"M{pts[0][0]:.1f} {pts[0][1]:.1f}"
    for x, y in pts[1:]: s += f"L{x:.1f} {y:.1f}"
    return s + "Z"

paths = {}
highlands = {}
for i, (name, ll) in enumerate(ISLANDS.items()):
    xy = [proj(lo, la) for lo, la in ll]
    size = max(max(p[0] for p in xy)-min(p[0] for p in xy), max(p[1] for p in xy)-min(p[1] for p in xy))
    dense = catmull(xy, samples=10 if size > 40 else 6)
    amt = 3.2 if size > 60 else 1.6 if size > 20 else 0.6
    coast = roughen(dense, amt, seed=i*97+13)
    paths[name] = to_path(coast)
    if size > 20 and name != "barren":
        highlands[name] = to_path(inner(coast, 0.62))

PLACES = {
  "diglipur": (93.00,13.27), "mayabunder": (92.92,12.91), "rangat": (92.94,12.50),
  "longIsland": (93.04,12.37), "baratang": (92.78,12.14), "havelock": (93.00,12.00),
  "neil": (93.03,11.83), "portBlair": (92.735,11.665), "rossIsland": (92.763,11.676),
  "northBay": (92.745,11.700), "barren": (93.86,12.28), "littleAndaman": (92.53,10.72),
}
places = {k: [round(v, 1) for v in proj(*ll)] for k, ll in PLACES.items()}

import os, sys
OUT = sys.argv[1] if len(sys.argv) > 1 else "src/components/home/andaman-map-data.ts"
with open(OUT, "w") as f:
    f.write("/**\n * Island outlines for the illustrated Andaman map, generated from rough\n * longitude/latitude control points (see scripts/generate-andaman-map.py),\n * projected into a 560 x 1000 viewBox. Simplified for illustration — not for\n * navigation.\n */\n")
    f.write(f"export const MAP_VIEWBOX = {{ width: {W}, height: {H} }} as const;\n\n")
    f.write("export const ISLAND_PATHS = " + json.dumps(paths, indent=2) + " as const;\n\n")
    f.write("/** Lighter interior shapes that read as forested high ground. */\n")
    f.write("export const ISLAND_HIGHLANDS = " + json.dumps(highlands, indent=2) + " as const;\n\n")
    f.write("/** Anchor points (viewBox units) for the named places. */\n")
    f.write("export const PLACE_POINTS = " + json.dumps(places, indent=2) + " as const;\n")
print({k: len(v) for k, v in paths.items()})
print(places)
