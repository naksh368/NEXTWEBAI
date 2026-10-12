#!/usr/bin/env python3
"""
Build the homepage island map from real coastline data.

Coastlines: Natural Earth 1:10m land (public domain), extracted for the
Andamans into scripts/data/andaman-coastline.json. Islands too small for that
dataset (Neil, Long Island, John Lawrence, Barren) are drawn at their true
position and approximate true size. Places, ferry routes and boats are all
positioned from real latitude/longitude.

Writes src/components/home/andaman-map-data.ts. Needs shapely (pip install
shapely) for the shaded high ground; run:

    python3 scripts/generate-andaman-map.py
"""
import json
import math
import os

from shapely.geometry import Polygon

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "scripts", "data", "andaman-coastline.json")
OUT = os.path.join(ROOT, "src", "components", "home", "andaman-map-data.ts")

# Map frame (degrees). Equirectangular, corrected for latitude so islands keep
# their true proportions.
LON0, LAT_TOP, LAT_BOTTOM = 92.15, 13.80, 10.45
H = 1000
SCALE_Y = H / (LAT_TOP - LAT_BOTTOM)
SCALE_X = SCALE_Y * math.cos(math.radians(12.1))
PAD_X = 14
W = 560


def project(lon, lat):
    return (PAD_X + (lon - LON0) * SCALE_X, (LAT_TOP - lat) * SCALE_Y)


KM_LAT = 111.0
KM_LON = 111.0 * math.cos(math.radians(12.1))


def blob(lon, lat, len_km, wid_km, angle_deg, wobble=0.07, n=28, seed=1.0):
    """A small island the 1:10m data does not include, at its true place and size."""
    pts = []
    a = math.radians(angle_deg)
    for i in range(n):
        t = 2 * math.pi * i / n
        r = 1 + wobble * (math.sin(3 * t + seed) + 0.6 * math.sin(5 * t + 2 * seed))
        x, y = (len_km / 2) * math.cos(t) * r, (wid_km / 2) * math.sin(t) * r
        dx, dy = x * math.cos(a) - y * math.sin(a), x * math.sin(a) + y * math.cos(a)
        pts.append([lon + dx / KM_LON, lat + dy / KM_LAT])
    return pts


def smooth_path(points, tension=0.5):
    """Closed Catmull-Rom spline through the coastline points, as SVG cubic Béziers."""
    n = len(points)
    p = points
    d = f"M{p[0][0]:.1f} {p[0][1]:.1f}"
    for i in range(n):
        p0, p1, p2, p3 = p[(i - 1) % n], p[i], p[(i + 1) % n], p[(i + 2) % n]
        c1 = (p1[0] + (p2[0] - p0[0]) * tension / 3, p1[1] + (p2[1] - p0[1]) * tension / 3)
        c2 = (p2[0] - (p3[0] - p1[0]) * tension / 3, p2[1] - (p3[1] - p1[1]) * tension / 3)
        d += f"C{c1[0]:.1f} {c1[1]:.1f} {c2[0]:.1f} {c2[1]:.1f} {p2[0]:.1f} {p2[1]:.1f}"
    return d + "Z"


def dedupe(points, min_dist=1.2):
    out = []
    for pt in points:
        if not out or math.dist(pt, out[-1]) >= min_dist:
            out.append(pt)
    if len(out) > 3 and math.dist(out[0], out[-1]) < min_dist:
        out.pop()
    return out


data = json.load(open(DATA))
rings = dict(data["rings"])
rings["neil"] = blob(93.035, 11.835, 5.2, 2.6, 35, seed=0.4)
rings["johnLawrence"] = blob(93.025, 12.065, 5.0, 2.4, 70, seed=1.7)
rings["longIsland"] = blob(92.968, 12.385, 6.5, 3.0, 80, seed=2.2)
rings["barren"] = blob(93.858, 12.278, 3.0, 2.8, 0, wobble=0.04, seed=0.9)

paths, highlands = {}, {}
for name, ring in rings.items():
    pts = dedupe([project(lon, lat) for lon, lat in ring])
    if len(pts) < 4:
        continue
    paths[name] = smooth_path(pts)
    if name == "barren":
        continue
    # Forested high ground: the island pulled in from its own coast.
    poly = Polygon(pts).buffer(0)
    inner = poly.buffer(-max(2.5, min(9.0, math.sqrt(poly.area) * 0.18)), join_style=1)
    if inner.is_empty:
        continue
    geoms = getattr(inner, "geoms", [inner])
    parts = []
    for g in geoms:
        if g.area < 6:
            continue
        coords = dedupe(list(g.exterior.simplify(0.6).coords)[:-1])
        if len(coords) >= 4:
            parts.append(smooth_path(coords))
    if parts:
        highlands[name] = "".join(parts)

# Settlements and sights at true positions (lon, lat).
PLACES = {
    "diglipur": (92.985, 13.255),
    "mayabunder": (92.905, 12.925),
    "rangat": (92.930, 12.500),
    "longIsland": (92.968, 12.385),
    "baratang": (92.765, 12.090),
    "havelock": (93.005, 11.985),
    "neil": (93.035, 11.835),
    "northBay": (92.762, 11.705),
    "rossIsland": (92.763, 11.676),
    "portBlair": (92.725, 11.623),
    "barren": (93.858, 12.278),
    "littleAndaman": (92.555, 10.640),
}
points = {k: [round(c, 1) for c in project(*v)] for k, v in PLACES.items()}


def route(a, b, ctrl):
    (x1, y1), (cx, cy), (x2, y2) = project(*a), project(*ctrl), project(*b)
    return f"M{x1:.0f} {y1:.0f} Q{cx:.0f} {cy:.0f} {x2:.0f} {y2:.0f}"


# Ferry and boat routes through open water (lon, lat), simplified.
ROUTES = {
    "pbHavelock": route((92.752, 11.672), (92.990, 12.020), (92.930, 11.790)),
    "havelockNeil": route((93.010, 11.975), (93.030, 11.850), (93.080, 11.915)),
    "neilPb": route((93.015, 11.828), (92.758, 11.660), (92.890, 11.705)),
    "pbLittle": route((92.735, 11.560), (92.560, 10.655), (92.800, 11.080)),
    "havelockBarren": route((93.030, 12.000), (93.840, 12.272), (93.430, 12.250)),
    "pbDiglipur": route((92.705, 11.640), (92.960, 13.235), (92.330, 12.450)),
}

ts = f'''/**
 * Island outlines for the homepage map, built from real coastline data
 * (Natural Earth 1:10m, public domain) by scripts/generate-andaman-map.py.
 * Neil, Long Island, John Lawrence and Barren are too small for that dataset
 * and are drawn at their true position and size. Places and routes use real
 * latitude/longitude. Do not edit by hand — re-run the script.
 */
export const MAP_VIEWBOX = {{ width: {W}, height: {H} }} as const;

export const ISLAND_PATHS = {json.dumps(paths, indent=2)} as const;

/** The forested interior, drawn a shade darker inside each island. */
export const ISLAND_HIGHLANDS = {json.dumps(highlands, indent=2)} as const;

export const PLACE_POINTS = {json.dumps(points, indent=2)} as const satisfies Record<string, readonly [number, number] | number[]>;

/** Ferry and boat routes through open water. */
export const MAP_ROUTES = {json.dumps(ROUTES, indent=2)} as const;
'''
open(OUT, "w").write(ts)
print("islands:", ", ".join(paths), "| highlands:", len(highlands))
for k, v in points.items():
    print(f"  {k:14s} {v}")
