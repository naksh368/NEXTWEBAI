import { unstable_cache } from "next/cache";

/**
 * Live Google rating and reviews through the Google Places API (New).
 *
 * Optional: set GOOGLE_PLACES_API_KEY and GOOGLE_PLACE_ID and the site shows
 * the business's current Google rating, review count and latest reviews (the
 * API returns up to five), refreshed every few hours. Without them, the rating
 * entered in Admin → Website Content and any reviews added in Admin →
 * Testimonials are used instead. Nothing here is ever invented.
 */

export type GoogleReview = {
  author: string;
  authorUrl: string | null;
  photoUrl: string | null;
  rating: number | null;
  text: string;
  when: string | null;
  publishTime: string | null;
};

export type GooglePlace = {
  rating: number | null;
  count: number | null;
  url: string | null;
  reviews: GoogleReview[];
};

const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);

/** Turn a Places API response into what the site shows; tolerant of missing fields. */
export function parsePlace(json: unknown): GooglePlace | null {
  if (!json || typeof json !== "object") return null;
  const p = json as Record<string, unknown>;
  const reviews = (Array.isArray(p.reviews) ? p.reviews : [])
    .map((r): GoogleReview | null => {
      const x = (r ?? {}) as Record<string, unknown>;
      const text = (x.text as Record<string, unknown> | undefined) ?? (x.originalText as Record<string, unknown> | undefined);
      const author = (x.authorAttribution ?? {}) as Record<string, unknown>;
      const body = str(text?.text);
      const name = str(author.displayName);
      if (!body || !name) return null; // star-only reviews have nothing to show
      const rating = num(x.rating);
      return {
        author: name,
        authorUrl: str(author.uri),
        photoUrl: str(author.photoUri),
        rating: rating === null ? null : Math.max(1, Math.min(5, Math.round(rating))),
        text: body,
        when: str(x.relativePublishTimeDescription),
        publishTime: str(x.publishTime),
      };
    })
    .filter((r): r is GoogleReview => r !== null);

  const rating = num(p.rating);
  const count = num(p.userRatingCount);
  if (rating === null && !reviews.length) return null;
  return {
    rating: rating === null ? null : Math.round(rating * 10) / 10,
    count: count === null ? null : Math.round(count),
    url: str(p.googleMapsUri),
    reviews,
  };
}

export function googleReviewsConfigured(): boolean {
  return Boolean(process.env.GOOGLE_PLACES_API_KEY && process.env.GOOGLE_PLACE_ID);
}

async function fetchPlace(): Promise<GooglePlace | null> {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  const id = process.env.GOOGLE_PLACE_ID;
  if (!key || !id) return null;
  try {
    const res = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(id)}?languageCode=en`, {
      headers: { "X-Goog-Api-Key": key, "X-Goog-FieldMask": "rating,userRatingCount,reviews,googleMapsUri" },
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    if (!res.ok) return null;
    return parsePlace(await res.json());
  } catch {
    return null;
  }
}

/** Cached for six hours so a busy day costs a handful of API calls, not thousands. */
export const getGooglePlace = unstable_cache(fetchPlace, ["google-place"], { revalidate: 6 * 3600, tags: ["google-reviews"] });
