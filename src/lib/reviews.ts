import { db } from "./db";
import type { SiteSettings } from "./site-settings";
import { getGooglePlace } from "./services/google-reviews";
import { formatDate } from "./utils";

export type ReviewItem = {
  key: string;
  author: string;
  text: string;
  rating: number | null;
  meta: string;
  source: "GOOGLE" | "DIRECT";
  link: string | null;
  photoUrl: string | null;
};

export type ReviewsData = {
  score: number | null;
  count: number | null;
  /** Where "read all reviews" goes: the live Google profile, else the link from Admin → Website Content. */
  url: string | null;
  items: ReviewItem[];
  live: boolean;
};

/**
 * The rating and reviews the site shows: live from Google when the Places API
 * is configured, plus every published testimonial. Live figures replace the
 * ones typed into Website Content, so the rating keeps itself up to date.
 */
export async function getReviews(settings: SiteSettings): Promise<ReviewsData> {
  const [place, testimonials] = await Promise.all([
    getGooglePlace().catch(() => null),
    db.testimonial
      .findMany({ where: { status: "PUBLISHED" }, orderBy: [{ sortOrder: "asc" }, { reviewDate: "desc" }, { createdAt: "desc" }], take: 60 })
      .catch(() => []),
  ]);

  const live: ReviewItem[] = (place?.reviews ?? []).map((r, i) => ({
    key: `g-${i}-${r.author}`,
    author: r.author,
    text: r.text,
    rating: r.rating,
    meta: [r.when, "Google"].filter(Boolean).join(" · "),
    source: "GOOGLE",
    link: r.authorUrl,
    photoUrl: r.photoUrl,
  }));
  // A review added by hand that is also live from Google would show twice.
  const liveKeys = new Set(live.map((r) => `${r.author.toLowerCase()}|${r.text.slice(0, 40).toLowerCase()}`));
  const added: ReviewItem[] = testimonials
    .filter((t) => !liveKeys.has(`${t.displayName.toLowerCase()}|${t.body.slice(0, 40).toLowerCase()}`))
    .map((t) => ({
      key: t.id,
      author: t.displayName,
      text: t.body,
      rating: t.rating,
      meta: [t.location, t.packageName, t.reviewDate ? formatDate(t.reviewDate) : null, t.source === "GOOGLE" ? "Google" : null].filter(Boolean).join(" · "),
      source: t.source === "GOOGLE" ? "GOOGLE" : "DIRECT",
      link: t.sourceUrl,
      photoUrl: t.photoUrl,
    }));

  return {
    score: place?.rating ?? settings.reviewScore,
    count: place?.rating != null ? place.count : settings.reviewCount,
    url: place?.url ?? (settings.reviewUrl || null),
    items: [...live, ...added],
    live: Boolean(place),
  };
}

/** Just the rating, for the badges (no testimonial query). */
export async function getRatingSummary(settings: SiteSettings): Promise<Pick<ReviewsData, "score" | "count" | "url">> {
  const place = await getGooglePlace().catch(() => null);
  return {
    score: place?.rating ?? settings.reviewScore,
    count: place?.rating != null ? place.count : settings.reviewCount,
    url: place?.url ?? (settings.reviewUrl || null),
  };
}
